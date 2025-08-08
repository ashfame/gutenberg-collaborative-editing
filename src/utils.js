/**
 * @typedef {Object} CursorState
 * @property {number} [blockIndex]        - The index of the block where the cursor is.
 * @property {number} [cursorPos]         - The cursor position within the block.
 * @property {number} [cursorPosStart]    - The start position of the selection.
 * @property {number} [cursorPosEnd]      - The end position of the selection.
 * @property {number} [blockIndexStart]   - The start block index of the selection.
 * @property {number} [blockIndexEnd]     - The end block index of the selection.
 */

function preventEditing(e) {
	// Allow scrolling events
	if (e.type === 'wheel' || e.type === 'scroll') return;

	// Prevent all editing interactions
	e.preventDefault();
	e.stopPropagation();
	return false;
}

export function lockEditor(editorElement) {
	editorElement.addEventListener('click', preventEditing, true);
	editorElement.addEventListener('mousedown', preventEditing, true);
	editorElement.addEventListener('mouseup', preventEditing, true);
	editorElement.addEventListener('dblclick', preventEditing, true);
	editorElement.addEventListener('keydown', preventEditing, true);
	editorElement.addEventListener('keypress', preventEditing, true);
	editorElement.addEventListener('keyup', preventEditing, true);
	editorElement.addEventListener('input', preventEditing, true);
	editorElement.addEventListener('change', preventEditing, true);
	editorElement.addEventListener('paste', preventEditing, true);
	editorElement.addEventListener('cut', preventEditing, true);
	editorElement.addEventListener('copy', preventEditing, true,);
	editorElement.addEventListener('focus', preventEditing, true);
	editorElement.addEventListener('focusin', preventEditing, true);
	editorElement.addEventListener('touchstart', preventEditing, true);
	editorElement.addEventListener('touchend', preventEditing, true);
}

export function releaseEditor(editorElement) {
	editorElement.removeEventListener('click', preventEditing, true);
	editorElement.removeEventListener('mousedown', preventEditing, true);
	editorElement.removeEventListener('mouseup', preventEditing, true);
	editorElement.removeEventListener('dblclick', preventEditing, true);
	editorElement.removeEventListener('keydown', preventEditing, true);
	editorElement.removeEventListener('keypress', preventEditing, true);
	editorElement.removeEventListener('keyup', preventEditing, true);
	editorElement.removeEventListener('input', preventEditing, true);
	editorElement.removeEventListener('change', preventEditing, true);
	editorElement.removeEventListener('paste', preventEditing, true);
	editorElement.removeEventListener('cut', preventEditing, true);
	editorElement.removeEventListener('copy', preventEditing, true,);
	editorElement.removeEventListener('focus', preventEditing, true);
	editorElement.removeEventListener('focusin', preventEditing, true);
	editorElement.removeEventListener('touchstart', preventEditing, true);
	editorElement.removeEventListener('touchend', preventEditing, true);
}
