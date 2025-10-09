import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { AwarenessState, CursorState, UserId } from '@/hooks/types';
import { useTrackedCurrentUser } from './useTrackedCurrentUser';
import { BlockInstance } from '@wordpress/blocks';

export const useBlockLocking = (
	currentUser: CursorState | null,
	otherUsers: AwarenessState,
	blocks: BlockInstance[]
) => {
	const { setLockedBlocks } = useDispatch( 'gce' );

	const trackedCurrentUser = useTrackedCurrentUser( currentUser );

	useEffect( () => {
		// target blocks which are locked by other users
		const targetBlocks: {
			[ blockIndex: number ]: UserId; // we currently don't use the userId,
			// but it's here for future use for cases where we want to highlight the user who locked the block
		} = {};

		const lockedBlocks: string[] = [];
		Object.entries( otherUsers ).forEach( ( [ , user ] ) => {
			if ( ! user.cursor_state ) {
				// eslint-disable-next-line no-alert
				alert(
					'🚧 found user in awareness state without cursor state,' +
						'check console'
				);
				// eslint-disable-next-line no-console
				console.log(
					'🚧 found user in awareness state without cursor state:',
					user
				);
				return;
			}

			if ( 'blockIndex' in user.cursor_state ) {
				if (
					trackedCurrentUser &&
					'blockIndex' in trackedCurrentUser &&
					trackedCurrentUser.blockIndex ===
						user.cursor_state.blockIndex
				) {
					// which one has the older timestamp?
					if ( user.cursor_ts < trackedCurrentUser.blockTs ) {
						targetBlocks[ user.cursor_state.blockIndex ] =
							user.user_data.id;
					}
					// if the current user is the one who has the older timestamp,
					// we do not need locks for ourselves, so do nothing
				} else {
					targetBlocks[ user.cursor_state.blockIndex ] =
						user.user_data.id;
				}
			}
		} );

		Object.entries( targetBlocks ).forEach( ( [ blockIndex ] ) => {
			const block = blocks[ Number( blockIndex ) ];
			if ( block ) {
				lockedBlocks.push( block.clientId );
			}
		} );

		setLockedBlocks( lockedBlocks );

		// Cleanup function to remove locks when users leave
		return () => {
			setLockedBlocks( [] );
		};
	}, [ trackedCurrentUser, otherUsers, blocks, setLockedBlocks ] );
};
