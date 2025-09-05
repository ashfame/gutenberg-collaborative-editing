import { CursorState } from './hooks/types';

function preventEditing( e: Event ) {
	// Allow scrolling events
	if ( e.type === 'wheel' || e.type === 'scroll' ) {
		return;
	}

	// Allow mouse events for text selection
	if (
		e.type === 'mousedown' ||
		e.type === 'mousemove' ||
		e.type === 'mouseup'
	) {
		return;
	}

	// Prevent all other editing interactions
	e.preventDefault();
	e.stopPropagation();
	return false;
}

const eventsToPrevent = [
	'click',
	'dblclick',
	'keydown',
	'keypress',
	'keyup',
	'input',
	'change',
	'paste',
	'cut',
	'copy',
	'touchstart',
	'touchend',
];

export function lockEditor( editorElement: HTMLElement ) {
	eventsToPrevent.forEach( ( event ) => {
		editorElement.addEventListener( event, preventEditing, true );
	} );
}

export function releaseEditor( editorElement: HTMLElement ) {
	eventsToPrevent.forEach( ( event ) => {
		editorElement.removeEventListener( event, preventEditing, true );
	} );
}

/**
 * Retrieves the current cursor state from the editor.
 *
 * @return {CursorState|null} The current cursor state,
 * or null if user cursor is not in editor.
 */
export const getCursorState = (): CursorState | null => {
	const blocks = window.wp?.data
		?.select( 'core/block-editor' )
		.getBlockOrder();
	const selectionStart = window.wp?.data
		?.select( 'core/block-editor' )
		.getSelectionStart();
	const selectionEnd = window.wp?.data
		?.select( 'core/block-editor' )
		.getSelectionEnd();

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
};

/**
 * Merges incoming blocks with existing blocks, preserving the engaged block.
 *
 * This function treats the `receivedBlocks` as the new source of truth for the
 * document structure. It then re-inserts the user's currently "engaged" block
 * back into the set at its original index. This preserves the user's work on
 * that block while accepting structural changes (additions/deletions) from
 * collaborators.
 *
 * If the `engagedBlockIndex` is outside the bounds of the `receivedBlocks`
 * (e.g., the block was part of a section deleted by a collaborator), the
 * engaged block is appended to the end of the set.
 *
 * @param {Array}  existingBlocks    The current blocks in the editor.
 * @param {Array}  receivedBlocks    The new blocks received from the transport.
 * @param {number} engagedBlockIndex The index of the block currently being edited.
 * @return {Array} The merged set of blocks.
 */
export const mergeBlocks = (
	existingBlocks: any[],
	receivedBlocks: any[],
	engagedBlockIndex: number
): Array< any > => {
	// Create a mutable copy of the received blocks.
	const blocksToSet = [ ...receivedBlocks ];

	if (
		engagedBlockIndex !== undefined &&
		engagedBlockIndex > -1 &&
		existingBlocks[ engagedBlockIndex ]
	) {
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
