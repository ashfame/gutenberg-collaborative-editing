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
		const engagedBlockClientId = engagedBlock.clientId;

		// Find the position of the engaged block in the new set.
		const receivedEngagedBlockIndex = blocksToSet.findIndex(
			( block ) => block.clientId === engagedBlockClientId
		);

		if ( receivedEngagedBlockIndex > -1 ) {
			// If the engaged block exists in the new set, preserve its content.
			blocksToSet[ receivedEngagedBlockIndex ] = engagedBlock;
		} else {
			// If the engaged block was deleted, re-insert it at its original position.
			// eslint-disable-next-line no-lonely-if
			if ( blocksToSet.length > engagedBlockIndex ) {
				blocksToSet.splice( engagedBlockIndex, 0, engagedBlock );
			} else {
				blocksToSet.push( engagedBlock );
			}
		}
	}

	return blocksToSet;
};
