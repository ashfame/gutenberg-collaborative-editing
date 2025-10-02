import { useEffect, useRef, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { MultiCursor } from './MultiCursor';
import { useCursorState } from './hooks/useCursorState';
import { CursorState, AwarenessState } from './hooks/types';
import { store as blockEditorStore } from '@wordpress/block-editor';

export const useMultiCursor = (
	currentUserId: number | null,
	awarenessState: AwarenessState,
	syncAwareness: ( awareness: CursorState ) => void
) => {
	const multiCursorRef = useRef< MultiCursor | null >( null );
	const overlayRef = useRef< HTMLDivElement | null >( null );
	const cursorState = useCursorState();

	const { blockCount } = useSelect( ( select ) => {
		const blockEditorSelect = select( blockEditorStore ) as any;

		return {
			blockCount: blockEditorSelect.getBlockCount(),
		};
	}, [] );

	// Function to broadcast the current user's cursor state.
	const broadcastCursor = useCallback( () => {
		if ( ! syncAwareness || ! currentUserId ) {
			return;
		}
		if ( cursorState ) {
			syncAwareness( cursorState );
		}
	}, [ syncAwareness, currentUserId, cursorState ] );

	useEffect( () => {
		broadcastCursor();
	}, [ broadcastCursor ] );

	useEffect( () => {
		// Don't do anything until the editor is ready.
		if ( blockCount === null || currentUserId === null ) {
			return;
		}

		const iframe = document.querySelector(
			'iframe[name="editor-canvas"]'
		) as HTMLIFrameElement | null;
		const editorDocument = iframe ? iframe.contentDocument : document;

		if ( ! editorDocument ) {
			return;
		}

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
			if ( editorWrapper instanceof HTMLElement ) {
				editorWrapper.style.position = 'relative';
			}

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
			try {
				multiCursorRef.current.renderCursors( awarenessState );
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( 'Error rendering cursors:', e );
			}
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
