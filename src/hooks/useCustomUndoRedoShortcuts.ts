import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

interface UseCustomUndoRedoShortcutsProps {
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

export const useCustomUndoRedoShortcuts = ( {
	undo,
	redo,
	canUndo,
	canRedo,
}: UseCustomUndoRedoShortcutsProps ) => {
	const { registerShortcut, unregisterShortcut } = useDispatch(
		'core/keyboard-shortcuts'
	);

	useEffect( () => {
		registerShortcut( {
			name: 'collaborative/undo',
			category: 'global',
			description: 'Undo your last change.',
			keyCombination: {
				modifier: 'mod',
				character: 'z',
			},
			handler: () => {
				if ( canUndo ) {
					undo();
				}

				// eslint-disable-next-line no-alert
				alert( 'prevented' );
				// Prevent the default Gutenberg undo behavior.
				return true;
			},
		} );

		registerShortcut( {
			name: 'collaborative/redo',
			category: 'global',
			description: 'Redo your last undone change.',
			keyCombination: {
				modifier: 'mod',
				shift: true,
				character: 'z',
			},
			handler: () => {
				if ( canRedo ) {
					redo();
				}
				// Prevent the default Gutenberg redo behavior.
				return true;
			},
		} );

		return () => {
			unregisterShortcut( 'collaborative/undo' );
			unregisterShortcut( 'collaborative/redo' );
		};
	}, [ registerShortcut, unregisterShortcut, undo, redo, canUndo, canRedo ] );
};
