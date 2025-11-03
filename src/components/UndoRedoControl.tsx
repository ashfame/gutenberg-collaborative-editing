import { Button, Icon } from '@wordpress/components';
import { undo as undoIcon, redo as redoIcon } from '@wordpress/icons';

interface UndoRedoControlProps {
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

export const UndoRedoControl = ( {
	undo,
	redo,
	canUndo,
	canRedo,
}: UndoRedoControlProps ) => {
	return (
		<div
			style={ {
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				paddingRight: '8px',
			} }
		>
			<Button
				icon={ <Icon icon={ undoIcon } /> }
				label="Undoooo"
				onClick={ undo }
				disabled={ ! canUndo }
			/>
			<Button
				icon={ <Icon icon={ redoIcon } /> }
				label="Redoooo"
				onClick={ redo }
				disabled={ ! canRedo }
			/>
		</div>
	);
};
