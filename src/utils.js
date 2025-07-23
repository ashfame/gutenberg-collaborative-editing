/**
 * @typedef {Object} CursorState
 * @property {number} [blockIndex]        - The index of the block where the cursor is.
 * @property {number} [cursorPos]         - The cursor position within the block.
 * @property {number} [cursorPosStart]    - The start position of the selection.
 * @property {number} [cursorPosEnd]      - The end position of the selection.
 * @property {number} [blockIndexStart]   - The start block index of the selection.
 * @property {number} [blockIndexEnd]     - The end block index of the selection.
 */

export const preventEditing = (e) => {
	// Allow scrolling events
	if (e.type === 'wheel' || e.type === 'scroll') return;

	// Prevent all editing interactions
	e.preventDefault();
	e.stopPropagation();
	return false;
};

export function disableAutoSave() {
	wp.data.dispatch('core/editor').updateEditorSettings({
		autosaveInterval: 999999,
		localAutosaveInterval: 999999,
		__experimentalLocalAutosaveInterval: 999999
	});
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
 * Determines if the cursor state needs to be broadcasted.
 *
 * @param {CursorState|null} cursorStateCurrent     The current cursor state.
 * @param {CursorState|null} cursorStateBroadcasted The last broadcasted cursor state.
 * @returns {boolean} Whether the cursor state needs to be broadcasted.
 */
export const needCursorStateBroadcast = (cursorStateCurrent, cursorStateBroadcasted) => {
	if (cursorStateCurrent === cursorStateBroadcasted) {
		return false;
	}

	if (!cursorStateCurrent || !cursorStateBroadcasted) {
		return true;
	}

	const keysA = Object.keys(cursorStateCurrent);
	const keysB = Object.keys(cursorStateBroadcasted);

	if (keysA.length !== keysB.length) {
		return true;
	}

	for (const key of keysA) {
		if (!keysB.includes(key) || cursorStateCurrent[key] !== cursorStateBroadcasted[key]) {
			return true;
		}
	}

	return false;
};
