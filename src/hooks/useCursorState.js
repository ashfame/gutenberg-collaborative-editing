import { useSelect } from '@wordpress/data';

export const useCursorState = () => {
	return useSelect( ( select ) => {
		const { getBlockOrder, getSelectionStart, getSelectionEnd } =
			select( 'core/block-editor' );

		const blocks = getBlockOrder();
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		console.log( 'cursorState', blocks, selectionStart, selectionEnd );

		if ( ! selectionStart?.clientId ) {
			return null;
		}

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

