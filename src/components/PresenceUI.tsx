import { createPortal } from '@wordpress/element';
import { useMultiCursor } from '@/useMultiCursor';
import AvatarList from './AvatarList';
import { CursorState, AwarenessState } from '@/hooks/types';
import { UndoRedoControl } from './UndoRedoControl';

interface PresenceUIProps {
	awarenessState: AwarenessState;
	syncAwareness: ( awareness: CursorState ) => void;
	currentUserId: number | null;
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

export const PresenceUI = ( {
	awarenessState,
	syncAwareness,
	currentUserId,
	undo,
	redo,
	canUndo,
	canRedo,
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
					<div
						style={ {
							display: 'flex',
							alignItems: 'center',
						} }
					>
						<UndoRedoControl
							undo={ undo }
							redo={ redo }
							canUndo={ canUndo }
							canRedo={ canRedo }
						/>
						<AvatarList users={ otherUsers } />
					</div>,
					headerTarget
				) }
		</>
	);
};
