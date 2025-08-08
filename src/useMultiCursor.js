import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { MultiCursor } from './MultiCursor';
import { useCursorState } from './hooks/useCursorState';

export const useMultiCursor = (
	currentUserId,
	awarenessState,
	syncAwareness
) => {
	const multiCursorRef = useRef( null );
	const overlayRef = useRef( null );
	const cursorState = useCursorState();

	const { blockCount, currentUser } = useSelect( ( select ) => {
		const editorSelect = select( 'core/block-editor' );
		const coreSelect = select( 'core' );
		return {
			blockCount: editorSelect?.getBlockCount(),
			currentUser: coreSelect?.getCurrentUser(),
		};
	}, [] );

	useEffect( () => {
		if ( cursorState && syncAwareness ) {
			syncAwareness( cursorState );
		}
	}, [ cursorState, syncAwareness ] );

	useEffect( () => {
		// Don't do anything until the editor is ready.
		if ( blockCount === null ) {
			return;
		}

		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
		const editorDocument = iframe ? iframe.contentDocument : document;
		const editorWrapper = iframe
			? editorDocument.body
			: document.querySelector( '.editor-styles-wrapper' );

		if ( ! editorWrapper ) {
			return;
		}

		// Ensure the overlay exists.
		if (
			! overlayRef.current ||
			! editorWrapper.contains( overlayRef.current )
		) {
			overlayRef.current?.remove();
			editorWrapper.style.position = 'relative';

			const overlay = editorDocument.createElement( 'div' );
			overlay.className = 'cursor-overlay';
			editorWrapper.appendChild( overlay );
			overlayRef.current = overlay;

			multiCursorRef.current = new MultiCursor(
				editorDocument,
				overlay,
				currentUserId
			);
		}

		// Render incoming cursors.
		if ( multiCursorRef.current && awarenessState ) {
			multiCursorRef.current.renderCursors( awarenessState );
		}

		// Cleanup on unmount.
		return () => {
			if ( overlayRef.current ) {
				overlayRef.current.remove();
			}
			overlayRef.current = null;
			multiCursorRef.current = null;
		};
	}, [ blockCount, currentUserId, awarenessState ] );
};
