import { useEffect, useRef } from '@wordpress/element';

/**
 * Handles the logic for syncing editor content changes.
 *
 * This hook debounces content changes to avoid excessive network requests and
 * calls a sync function when the content has stabilized.
 *
 * @param {object}   config
 * @param {boolean}  config.isReadOnly   - Disables syncing if true.
 * @param {number}   config.postId       - The ID of the post.
 * @param {object}   config.editorContent - The current editor content.
 * @param {Function} config.onSync        - The function to call to sync the content.
 */
export const useContentSyncer = ( {
	isReadOnly,
	postId,
	editorContent,
	onSync,
} ) => {
	const syncState = useRef( {
		timeoutId: null,
		lastContent: '',
	} );

	useEffect( () => {
		if ( isReadOnly || ! postId ) {
			return;
		}

		const contentStr = JSON.stringify( editorContent );

		if ( contentStr !== syncState.current.lastContent ) {
			syncState.current.lastContent = contentStr;

			// Clear existing timeout
			if ( syncState.current.timeoutId ) {
				clearTimeout( syncState.current.timeoutId );
			}

			// Schedule sync after 200ms delay
			syncState.current.timeoutId = setTimeout( () => {
				onSync( editorContent );
			}, 200 );
		}
	}, [ postId, editorContent, isReadOnly, onSync ] );

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( syncState.current.timeoutId ) {
				clearTimeout( syncState.current.timeoutId );
			}
		};
	}, [] );
};
