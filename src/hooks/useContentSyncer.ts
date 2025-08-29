import { useEffect, useRef } from '@wordpress/element';
import { CursorState } from './types';

interface UseContentSyncerConfig {
	collaborationMode: string;
	isLockHolder: boolean;
	postId: number;
	editorContent: any;
	blockContent: string; // current block content
	cursorState: CursorState | null;
	onSync: ( payload: { content: any; blockIndex?: number } ) => void;
}

/**
 * Handles the logic for syncing editor content changes.
 *
 * This hook debounces content changes to avoid excessive network requests and
 * calls a sync function when the content has stabilized.
 */
export const useContentSyncer = ( {
	collaborationMode,
	isLockHolder,
	postId,
	editorContent,
	blockContent,
	cursorState,
	onSync,
}: UseContentSyncerConfig ) => {
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
