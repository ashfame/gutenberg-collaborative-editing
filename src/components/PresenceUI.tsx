import { createPortal, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMultiCursor } from '@/useMultiCursor';
import AvatarList from './AvatarList';
import { CursorState, AwarenessState } from '@/hooks/types';
import { store as coreStore } from '@wordpress/core-data';

interface PresenceUIProps {
	awarenessState: AwarenessState;
	syncAwareness: ( awareness: CursorState ) => void;
}

export const PresenceUI = ( {
	awarenessState,
	syncAwareness,
}: PresenceUIProps ) => {
	const { setLockedBlocks } = useDispatch( 'gce' );
	const { currentUserId } = useSelect(
		( select ) => ( {
			currentUserId: select( coreStore )?.getCurrentUser()?.id,
		} ),
		[]
	);

	const otherUsers = awarenessState;

	useMultiCursor( currentUserId, otherUsers, syncAwareness );

	// Assume user's cursors carries edit intent
	// so lock all blocks where cursors of other users are at
	useEffect( () => {
		const lockedBlocks: string[] = [];
		Object.values( otherUsers ).forEach( ( user ) => {
			const blockIndex =
				'blockIndex' in user.cursor_state
					? user.cursor_state.blockIndex
					: user.cursor_state.blockIndexStart;

			const existingBlocks = wp.data
				.select( 'core/block-editor' )
				.getBlocks();

			const block = existingBlocks[ blockIndex ];
			if ( block ) {
				lockedBlocks.push( block.clientId );
			}
		} );
		setLockedBlocks( lockedBlocks );

		// Cleanup function to remove locks when users leave
		return () => {
			setLockedBlocks( [] );
		};
	}, [ otherUsers, setLockedBlocks ] );

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
