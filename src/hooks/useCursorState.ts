import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { CursorState } from './types';

/**
 * A reactive hook to get the current cursor state from the editor.
 *
 * @return {CursorState|null} The current cursor state,
 * or null if user cursor is not in editor.
 */
export const useCursorState = (): CursorState | null => {
	return useSelect( ( select ) => {
		const editorSelector = select(
			blockEditorStore
		) as /** @type {import('@wordpress/block-editor').BlockEditorSelector} */ any;

		const selectionStart = editorSelector.getSelectionStart();

		if ( ! selectionStart?.clientId ) {
			return null;
		}

		const blocks = editorSelector.getBlockOrder();
		const selectionEnd = editorSelector.getSelectionEnd();
		const sameBlock = selectionStart.clientId === selectionEnd.clientId;

		if ( sameBlock ) {
			const blockIndex = blocks.indexOf( selectionStart.clientId );
			if ( selectionStart.offset === selectionEnd.offset ) {
				return {
					blockIndex,
					cursorPos: selectionStart.offset,
				};
			}
			return {
				blockIndex,
				cursorPosStart: selectionStart.offset,
				cursorPosEnd: selectionEnd.offset,
			};
		}
		const blockIndexStart = blocks.indexOf( selectionStart.clientId );
		const blockIndexEnd = blocks.indexOf( selectionEnd.clientId );
		return {
			blockIndexStart,
			blockIndexEnd,
			cursorPosStart: selectionStart.offset,
			cursorPosEnd: selectionEnd.offset,
		};
	}, [] );
};
