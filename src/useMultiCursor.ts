import { useEffect, useRef, useCallback } from 'react';
import { useSelect } from '@wordpress/data';
import { MultiCursor } from './MultiCursor';
import { getCursorState } from './utils';
import { CollaborativeState, CursorState } from './hooks/types';

export const useMultiCursor = (
	currentUserId: number,
	awarenessState: CollaborativeState[ 'awareness' ],
	syncAwareness: ( awareness: CursorState ) => void
) => {
	const multiCursorRef = useRef<MultiCursor | null>( null );
	const overlayRef = useRef<HTMLDivElement | null>( null );

	const { blockCount, currentUser } = useSelect( ( select ) => {
		const editorSelect = select( 'core/block-editor' );
		const coreSelect = select( 'core' );
		return {
			blockCount: editorSelect?.getBlockCount(),
			currentUser: coreSelect?.getCurrentUser(),
		};
	}, [] );

	// Function to broadcast the current user's cursor state.
	const broadcastCursor = useCallback( () => {
		if ( ! syncAwareness || ! currentUser ) {
			return;
		}
		const cursorState = getCursorState();
		if ( cursorState ) {
			syncAwareness( cursorState );
		}
	}, [ syncAwareness, currentUser ] );

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

		// Set up event listeners to broadcast our own cursor.
		const handleSelectionChange = () => broadcastCursor();
		editorDocument.addEventListener(
			'selectionchange',
			handleSelectionChange
		);

		// Cleanup on unmount.
		return () => {
			editorDocument.removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
			if ( overlayRef.current ) {
				overlayRef.current.remove();
			}
			overlayRef.current = null;
			multiCursorRef.current = null;
		};
	}, [ blockCount, currentUserId, awarenessState, broadcastCursor ] );
};
