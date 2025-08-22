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


/**
 * Retrieves the current cursor state from the editor.
 *
 * @returns {CursorState|null} The current cursor state, or null if no selection exists.
 */
export const getCursorState = () => {
	const blocks = window.wp?.data?.select('core/block-editor').getBlockOrder();
	const selectionStart = window.wp?.data?.select('core/block-editor').getSelectionStart();
	const selectionEnd = window.wp?.data?.select('core/block-editor').getSelectionEnd();

	if ( ! selectionStart.clientId ) {
		return null;
	}

	/**
	 * Three possible states:
	 *
	 * 1) User cursor sitting in one of the blocks
	 * 2) User cursor highlighting some text within the block
	 * 3) User cursor highlighting some text across blocks
	 */

	const sameBlock = selectionStart.clientId === selectionEnd.clientId;

	if ( sameBlock ) {
		const blockIndex = blocks.indexOf(selectionStart.clientId);
		if ( selectionStart.offset === selectionEnd.offset ) {
			return {
				'blockIndex': blockIndex,
				'cursorPos': selectionStart.offset
			};
		} else {
			return {
				'blockIndex': blockIndex,
				'cursorPosStart': selectionStart.offset,
				'cursorPosEnd': selectionEnd.offset
			};
		}
	} else {
		const blockIndexStart = blocks.indexOf(selectionStart.clientId);
		const blockIndexEnd = blocks.indexOf(selectionEnd.clientId);
		return {
			'blockIndexStart': blockIndexStart,
			'blockIndexEnd': blockIndexEnd,
			'cursorPosStart': selectionStart.offset,
			'cursorPosEnd': selectionEnd.offset
		};
	}
};

/**
 * Merges incoming blocks with existing blocks, preserving the engaged block.
 *
 * @param {Array} existingBlocks    The current blocks in the editor.
 * @param {Array} receivedBlocks    The new blocks received from the transport.
 * @param {number} engagedBlockIndex The index of the block currently being edited.
 * @returns {Array} The merged set of blocks.
 */
export const mergeBlocks = ( existingBlocks, receivedBlocks, engagedBlockIndex ) => {
	let blocksToSet = receivedBlocks;

	if ( engagedBlockIndex !== undefined && engagedBlockIndex > -1 && existingBlocks[ engagedBlockIndex ] ) {
		const engagedBlock = existingBlocks[ engagedBlockIndex ];
		if ( blocksToSet.length > engagedBlockIndex ) {
			blocksToSet[ engagedBlockIndex ] = engagedBlock;
		} else {
			// If the engaged block is outside the new set of blocks, append it.
			blocksToSet.push( engagedBlock );
		}
	}

	return blocksToSet;
};
