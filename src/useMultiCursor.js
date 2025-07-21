import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelect } from '@wordpress/data';
import { MultiCursor } from './MultiCursor';

export const useMultiCursor = (currentUserId) => {
	const multiCursorRef = useRef(null);
	const overlayRef = useRef(null);
	const [awarenessData, setAwarenessData] = useState(null);

	const blockCount = useSelect((select) => {
		// We can detect when the editor is ready by checking if getBlockCount returns a non-null value.
		// In the site editor, the store is 'core/block-editor'.
		// In the post editor, it can also be 'core/block-editor'.
		return select('core/block-editor')?.getBlockCount();
	}, []);

	const updateAwarenessState = useCallback((newState) => {
		setAwarenessData(newState);
	}, []);

	useEffect(() => {
		// Don't do anything until the editor is ready and we have data.
		if (blockCount === null || !awarenessData) {
			return;
		}

		const iframe = document.querySelector('iframe[name="editor-canvas"]');
		if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) {
			return;
		}
		const editorDocument = iframe.contentDocument;
		const editorWrapper = editorDocument.body;
		
		// Ensure the overlay exists.
		if (!overlayRef.current || !editorDocument.body.contains(overlayRef.current)) {
			// Clean up any previous overlay to be safe.
			overlayRef.current?.remove();

			// Make parent relative.
			editorWrapper.style.position = 'relative';

			// Create and append overlay IN THE IFRAME's document.
			const overlay = editorDocument.createElement('div');
			overlay.className = 'cursor-overlay';
			editorWrapper.appendChild(overlay);
			overlayRef.current = overlay;

			// Initialize MultiCursor with the iframe's document.
			multiCursorRef.current = new MultiCursor(editorDocument, overlay, currentUserId);
		}
		
		// We have everything we need, render the cursors.
		if (multiCursorRef.current) {
			// remove inactive cursors based on user's heartbeat_ts (user active/inactive) and not their cursor_ts (cursor position decay)
			multiCursorRef.current.renderCursors(Object.fromEntries(
				Object.entries(awarenessData).filter(([userId, user]) => {
					return user.heartbeat_ts + parseInt( window.gce.awarenessTimeout ) > Math.floor(Date.now()/1000);
				})
			));
		}

		// Cleanup on unmount.
		return () => {
			if (overlayRef.current) {
				overlayRef.current.remove();
			}
			overlayRef.current = null;
			multiCursorRef.current = null;
		};

	}, [awarenessData, blockCount, currentUserId]);

	return { updateAwarenessState };
};
