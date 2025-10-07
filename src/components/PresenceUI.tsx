import { createPortal, useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { useMultiCursor } from '@/useMultiCursor';
import AvatarList from './AvatarList';
import { CursorState, AwarenessState } from '@/hooks/types';
import { useCursorState } from '@/hooks/useCursorState';
import isEqual from 'lodash.isequal';

interface Occupant {
	userId: number | null;
	timestamp: number;
}

interface BlockOccupants {
	[ blockId: string ]: Occupant[];
}

interface PresenceUIProps {
	awarenessState: AwarenessState;
	syncAwareness: ( awareness: CursorState ) => void;
	currentUserId: number | null;
}

export const PresenceUI = ( {
	awarenessState,
	syncAwareness,
	currentUserId,
}: PresenceUIProps ) => {
	const { setLockedBlocks } = useDispatch( 'gce' );
	const currentUserCursorState = useCursorState();
	const [ blockOccupants, setBlockOccupants ] = useState< BlockOccupants >(
		{}
	);

	const allUsers = awarenessState;
	const currentUser = currentUserId ? allUsers[ currentUserId ] : null;
	const otherUsers = Object.keys( allUsers ).reduce( ( acc, key ) => {
		const userId = Number( key );
		if ( userId !== currentUserId ) {
			acc[ userId ] = allUsers[ userId ];
		}
		return acc;
	}, {} as AwarenessState );

	useMultiCursor( currentUserId, otherUsers, syncAwareness );

	// Assume user's cursors carries edit intent
	// so lock all blocks where cursors of other users are at
	useEffect( () => {
		const newBlockOccupants: BlockOccupants = { ...blockOccupants };

		// Helper to get block index from cursor state
		const getBlockIndex = ( state: CursorState | null ) => {
			if ( ! state ) {
				return null;
			}
			return 'blockIndex' in state
				? state.blockIndex
				: state.blockIndexStart;
		};

		// Remove users who are no longer present
		Object.keys( newBlockOccupants ).forEach( ( blockId ) => {
			newBlockOccupants[ blockId ] = newBlockOccupants[ blockId ].filter(
				( occupant: Occupant ) =>
					Object.values( otherUsers ).some(
						( user ) => user.user_data.id === occupant.userId
					) || occupant.userId === currentUserId
			);
		} );

		// Update occupants based on other users' positions
		Object.values( otherUsers ).forEach( ( user ) => {
			const blockIndex = getBlockIndex( user.cursor_state );
			if ( blockIndex === null ) {
				return;
			}

			// Remove user from any other block they might have been in
			Object.keys( newBlockOccupants ).forEach( ( blockId ) => {
				if ( blockId !== blockIndex.toString() ) {
					newBlockOccupants[ blockId ] = newBlockOccupants[
						blockId
					].filter(
						( occupant: Occupant ) =>
							occupant.userId !== user.user_data.id
					);
				}
			} );

			if ( ! newBlockOccupants[ blockIndex ] ) {
				newBlockOccupants[ blockIndex ] = [];
			}
			if (
				! newBlockOccupants[ blockIndex ].some(
					( o: Occupant ) => o.userId === user.user_data.id
				)
			) {
				newBlockOccupants[ blockIndex ].push( {
					userId: user.user_data.id,
					timestamp: user.cursor_ts,
				} );
			}
		} );

		// Update for the current user
		const currentUserBlockIndex = getBlockIndex( currentUserCursorState );
		Object.keys( newBlockOccupants ).forEach( ( blockId ) => {
			if (
				currentUserBlockIndex === null ||
				blockId !== currentUserBlockIndex.toString()
			) {
				newBlockOccupants[ blockId ] = newBlockOccupants[
					blockId
				].filter(
					( occupant: Occupant ) => occupant.userId !== currentUserId
				);
			}
		} );

		if ( currentUserBlockIndex !== null ) {
			if ( ! newBlockOccupants[ currentUserBlockIndex ] ) {
				newBlockOccupants[ currentUserBlockIndex ] = [];
			}
			if (
				! newBlockOccupants[ currentUserBlockIndex ].some(
					( o: Occupant ) => o.userId === currentUserId
				)
			) {
				if ( currentUser ) {
					newBlockOccupants[ currentUserBlockIndex ].push( {
						userId: currentUserId,
						timestamp: currentUser.cursor_ts,
					} );
				}
			}
		}

		if ( ! isEqual( blockOccupants, newBlockOccupants ) ) {
			setBlockOccupants( newBlockOccupants );
		}

		// Determine locked blocks
		const lockedBlocks: string[] = [];
		Object.entries( newBlockOccupants ).forEach(
			( [ blockIndex, occupants ] ) => {
				if ( occupants.length > 1 ) {
					const sortedOccupants = [ ...occupants ].sort(
						( a, b ) => a.timestamp - b.timestamp
					);
					const lockHolder = sortedOccupants[ 0 ];

					if ( currentUserId !== lockHolder.userId ) {
						const existingBlocks = wp.data
							.select( 'core/block-editor' )
							.getBlocks();
						const block =
							existingBlocks[ parseInt( blockIndex, 10 ) ];
						if ( block ) {
							lockedBlocks.push( block.clientId );
						}
					}
				} else if (
					occupants.length === 1 &&
					occupants[ 0 ].userId !== currentUserId
				) {
					const existingBlocks = wp.data
						.select( 'core/block-editor' )
						.getBlocks();
					const block = existingBlocks[ parseInt( blockIndex, 10 ) ];
					if ( block ) {
						lockedBlocks.push( block.clientId );
					}
				}
			}
		);

		setLockedBlocks( lockedBlocks );

		return () => {
			setLockedBlocks( [] );
		};
	}, [
		otherUsers,
		setLockedBlocks,
		currentUserCursorState,
		currentUserId,
		blockOccupants,
	] );

	if ( ! otherUsers || Object.keys( otherUsers ).length === 0 ) {
		return null;
	}

	const headerTarget = document.querySelector( '.editor-header__center' );
	return (
		<>
			{ headerTarget &&
				createPortal(
					<AvatarList users={ otherUsers } />,
					headerTarget
				) }
		</>
	);
};
