import { createPortal } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
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
	const { currentUserId } = useSelect(
		( select ) => ( {
			currentUserId: select( coreStore )?.getCurrentUser()?.id,
		} ),
		[]
	);

	// Create a new object for awareness state to exclude the current user for rendering.
	const otherUsers = { ...awarenessState };
	if ( currentUserId ) {
		delete otherUsers[ currentUserId ];
	}

	useMultiCursor( currentUserId, otherUsers, syncAwareness );

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
