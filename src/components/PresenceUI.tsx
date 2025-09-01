import { createPortal } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useMultiCursor } from '../useMultiCursor';
import AvatarList from './AvatarList';
import { CursorState, AwarenessState } from '../hooks/types';
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

	// Modify awareness state to exclude current user
	if ( currentUserId ) {
		delete awarenessState[ currentUserId ];
	}

	useMultiCursor( currentUserId, awarenessState, syncAwareness );

	if ( ! awarenessState || Object.keys( awarenessState ).length === 0 ) {
		return null;
	}

	const headerTarget = document.querySelector( '.editor-header__center' );
	return (
		<>
			{ headerTarget &&
				createPortal(
					<AvatarList users={ awarenessState } />,
					headerTarget
				) }
		</>
	);
};
