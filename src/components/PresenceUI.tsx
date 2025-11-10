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

	const centerHeaderTarget = document.querySelector(
		'.editor-header__center'
	);
	const toolbarHeaderTarget = document.querySelector(
		'.editor-header__toolbar'
	);

	return (
		<>
			{ centerHeaderTarget &&
				createPortal(
					<AvatarList users={ otherUsers } />,
					centerHeaderTarget
				) }
			{ toolbarHeaderTarget &&
				createPortal(
					<UndoRedoControl
						undo={ undo }
						redo={ redo }
						canUndo={ canUndo }
						canRedo={ canRedo }
					/>,
					toolbarHeaderTarget
				) }
		</>
	);
};
