import { createPortal } from '@wordpress/element';
import { useMultiCursor } from '@/useMultiCursor';
import AvatarList from './AvatarList';
import { CursorState, AwarenessState } from '@/hooks/types';

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
	const otherUsers = awarenessState;

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
