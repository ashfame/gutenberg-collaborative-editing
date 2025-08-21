import { useEffect, useRef } from '@wordpress/element';

/**
 * Handles the logic for syncing editor content changes.
 *
 * This hook debounces content changes to avoid excessive network requests and
 * calls a sync function when the content has stabilized.
 *
 * @param {object}   config
 * @param {string}   config.collaborationMode - The collaboration mode.
 * @param {boolean}  config.isLockHolder  - Is user the lock holder.
 * @param {number}   config.postId       - The ID of the post.
 * @param {object}   config.editorContent - The current editor content.
 * @param {string}   config.blockContent  - The current block content.
 * @param {object}   config.cursorState  - The current cursor state.
 * @param {Function} config.onSync        - The function to call to sync the content.
 */
export const useContentSyncer = ( {
	collaborationMode,
	isLockHolder,
	postId,
	editorContent,
	blockContent,
	cursorState,
	onSync,
} ) => {
	const syncState = useRef( {
		timeoutId: null,
		lastContent: '',
	} );

	// For full content sync every-time
	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		if ( collaborationMode !== 'READ-ONLY-FOLLOW' ) {
			return;
		}

		if ( collaborationMode === 'READ-ONLY-FOLLOW' && ! isLockHolder ) {
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
				onSync( { content: editorContent } );
			}, 200 );
		}
	}, [ postId, editorContent, isLockHolder, onSync, collaborationMode ] );

	// For block-level content sync
	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		if ( collaborationMode !== 'BLOCK-LEVEL-LOCKS' ) {
			return;
		}

		if ( ! cursorState || cursorState && cursorState.blockIndex === undefined ) {
			return;
		}

		const contentStr = blockContent;

		if ( contentStr !== syncState.current.lastContent ) {
			syncState.current.lastContent = contentStr;

			// Clear existing timeout
			if ( syncState.current.timeoutId ) {
				clearTimeout( syncState.current.timeoutId );
			}

			// Schedule sync after 200ms delay
			syncState.current.timeoutId = setTimeout( () => {
				onSync( {
					content: blockContent,
					blockIndex: cursorState.blockIndex,
				} );
			}, 200 );
		}
	}, [ postId, blockContent, cursorState, onSync, collaborationMode ] );

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( syncState.current.timeoutId ) {
				clearTimeout( syncState.current.timeoutId );
			}
		};
	}, [] );
};
