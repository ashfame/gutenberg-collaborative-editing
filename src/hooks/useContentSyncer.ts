import { useEffect, useRef } from '@wordpress/element';
import { CursorState } from './types';
import { BlockChangeTracker, Block } from '@/block-sync';
import { BlockInstance, serialize } from '@wordpress/blocks';
import {
	BlockOpAddPayload,
	BlockOpDelPayload,
	BlockOpMovePayload,
	BlockOpUpdatePayload,
	ContentSyncPayload,
	BlockOpPayload,
	BlockOpsPayload,
	TitleSyncPayload,
	FullContentSyncPayload,
} from '@/transports/types';

interface UseContentSyncerConfig {
	collaborationMode: string;
	isLockHolder: boolean;
	postId: number;
	blocks: BlockInstance[];
	editorContent: any;
	blockContent: string; // current block content
	cursorState: CursorState | null;
	onSync: ( payload: ContentSyncPayload ) => void;
	tracker: React.RefObject< BlockChangeTracker >;
}

/**
 * Handles the logic for syncing editor content changes.
 *
 * This hook debounces content changes to avoid excessive network requests and
 * calls a sync function when the content has stabilized.
 * @param root0
 * @param root0.collaborationMode
 * @param root0.isLockHolder
 * @param root0.postId
 * @param root0.blocks
 * @param root0.editorContent
 * @param root0.blockContent
 * @param root0.cursorState
 * @param root0.onSync
 * @param root0.tracker
 */
export const useContentSyncer = ( {
	collaborationMode,
	isLockHolder,
	postId,
	blocks,
	editorContent,
	blockContent,
	cursorState,
	onSync,
	tracker,
}: UseContentSyncerConfig ) => {
	const syncState = useRef( {
		timeoutId: null as number | null,
		lastContent: '',
		lastTitle: '',
	} );
	const isInitialMount = useRef( true );

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

		// Send full content
		const contentStr = JSON.stringify( editorContent );

		if ( contentStr !== syncState.current.lastContent ) {
			syncState.current.lastContent = contentStr;

			// Clear existing timeout
			if ( syncState.current.timeoutId ) {
				clearTimeout( syncState.current.timeoutId );
			}

			// Schedule sync after 200ms delay
			syncState.current.timeoutId = window.setTimeout( () => {
				onSync( {
					type: 'full',
					payload: contentStr,
				} as FullContentSyncPayload );
			}, 200 );
		}
	}, [ postId, editorContent, isLockHolder, onSync, collaborationMode ] );

	// For block-level content sync
	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		if ( ! blocks || blocks.length === 0 ) {
			return;
		}

		if ( collaborationMode !== 'BLOCK-LEVEL-LOCKS' ) {
			return;
		}

		// The tracker expects a simplified `Block` object.
		const mappedBlocks: Block[] = blocks.map( ( block ) => ( {
			clientId: block.clientId,
			content: serialize( [ block ] ),
		} ) );

		if ( isInitialMount.current ) {
			// On initial mount, update editor state as is (which has already
			// been overwritten by shadow copy in useDataManager).
			// This way,
			// we can start tracking for block ops from this point onwards.
			if ( tracker.current ) {
				const operations =
					tracker.current.updateFromEditor( mappedBlocks );
				// eslint-disable-next-line no-console
				console.log( 'Pending operations - ignore@mount:', operations );
			}
			isInitialMount.current = false;
			return;
		}

		if ( ! cursorState || ! ( 'blockIndex' in cursorState ) ) {
			return;
		}

		if ( tracker.current ) {
			const operations = tracker.current.updateFromEditor( mappedBlocks );
			if ( operations.length > 0 ) {
				const ops: BlockOpPayload[] = [];
				// eslint-disable-next-line no-console
				console.log( 'Pending operations - needToSync:', operations );
				operations.forEach( ( op ) => {
					const timestamp = Date.now();
					switch ( op.type ) {
						case 'insert': {
							const payload: BlockOpAddPayload = {
								op: 'insert',
								blockIndex: op.index,
								blockContent: op.block.content,
								timestamp,
							};
							ops.push( payload );
							break;
						}
						case 'update': {
							const payload: BlockOpUpdatePayload = {
								op: 'update',
								blockIndex: op.index,
								blockContent: op.block.content,
								timestamp,
							};
							ops.push( payload );
							break;
						}
						case 'delete': {
							const payload: BlockOpDelPayload = {
								op: 'del',
								blockIndex: op.index,
								timestamp,
							};
							ops.push( payload );
							break;
						}
						case 'move': {
							const payload: BlockOpMovePayload = {
								op: 'move',
								fromBlockIndex: op.fromIndex,
								toBlockIndex: op.toIndex,
								timestamp,
							};
							ops.push( payload );
							break;
						}
					}
				} );
				onSync( {
					type: 'ops',
					payload: ops,
				} as BlockOpsPayload );
			}
		}

		// // We only send the block content and not the entire editor content
		// // but title is always sent
		// const contentStr = JSON.stringify( {
		// 	html: blockContent,
		// 	title: editorContent.title,
		// } );
		//
		// if ( contentStr !== syncState.current.lastContent ) {
		// 	syncState.current.lastContent = contentStr;
		//
		// 	// Clear existing timeout
		// 	if ( syncState.current.timeoutId ) {
		// 		clearTimeout( syncState.current.timeoutId );
		// 	}
		//
		// 	// Schedule sync after 200ms delay
		// 	syncState.current.timeoutId = window.setTimeout( () => {
		// 		onSync( {
		// 			content: contentStr,
		// 			blockIndex: cursorState.blockIndex,
		// 		} );
		// 	}, 200 );
		// }
	}, [
		postId,
		editorContent,
		blockContent,
		cursorState,
		onSync,
		collaborationMode,
		blocks,
		tracker,
	] );

	// Separate title sync for block-level collaboration mode
	useEffect( () => {
		if (
			! postId ||
			collaborationMode !== 'BLOCK-LEVEL-LOCKS' ||
			! isLockHolder
		) {
			return;
		}

		// Only sync if title has actually changed
		if (
			editorContent.title &&
			editorContent.title !== syncState.current.lastTitle
		) {
			syncState.current.lastTitle = editorContent.title;
			onSync( {
				type: 'title',
				payload: editorContent.title,
			} as TitleSyncPayload );
		}
	}, [
		postId,
		editorContent.title,
		collaborationMode,
		isLockHolder,
		onSync,
	] );

	// Cleanup timeout on unmount
	useEffect( () => {
		const syncerState = syncState.current;
		return () => {
			if ( syncerState.timeoutId ) {
				clearTimeout( syncerState.timeoutId );
			}
		};
	}, [] );
};
