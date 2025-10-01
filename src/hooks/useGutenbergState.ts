import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useCursorState } from './useCursorState';
import { CursorState } from './types';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { BlockInstance } from '@wordpress/blocks';

interface GutenbergState {
	currentUserId: number | null;
	isLockHolder: boolean;
	editorContent: { html: string; title: string };
	blockContent: string | null;
	cursorState: CursorState | null;
	blocks: BlockInstance[];
}

/**
 * A hook to fetch and consolidate all necessary state from the Gutenberg editor.
 *
 * This hook centralizes all interactions with the `@wordpress/data` store,
 * providing a clean and isolated way to access editor-specific data.
 */
export const useGutenbergState = (): GutenbergState => {
	const {
		currentUserId,
		isLockHolder,
		editorContentHTML,
		editorContentTitle,
		blocks,
	} = useSelect( ( select ) => {
		const editorSelect = select( editorStore );
		const coreSelect = select( coreStore );
		const blockEditorSelect = select( blockEditorStore );

		const activePostLock = (
			editorSelect as /** @type {import('@wordpress/editor').EditorSelector} */ any
		 ).getActivePostLock();
		const currentUser = (
			coreSelect as /** @type {import('@wordpress/core-data').CoreDataSelector} */ any
		 ).getCurrentUser();
		const CUID = currentUser?.id || null;
		const lockHolderId = activePostLock
			? parseInt( activePostLock.split( ':' ).pop() )
			: null;

		// The user who doesn't have the lock can't query the active lock,
		// so we can't get the lock owner. If the lock owner is null,
		// we treat it as a read-only state for the current user.
		const isReadOnly =
			lockHolderId === null ||
			( lockHolderId !== null && CUID !== lockHolderId );

		const contentHTML =
			(
				editorSelect as /** @type {import('@wordpress/editor').EditorSelector} */ any
			 ).getEditedPostContent() || '';
		const contentTitle =
			(
				editorSelect as /** @type {import('@wordpress/editor').EditorSelector} */ any
			 ).getEditedPostAttribute( 'title' ) || '';

		return {
			currentUserId: CUID,
			isLockHolder: ! isReadOnly,
			editorContentHTML: contentHTML,
			editorContentTitle: contentTitle,
			blocks: ( blockEditorSelect as any )?.getBlocks() || [],
		};
	}, [] );

	const editorContent = useMemo(
		() => ( {
			title: editorContentTitle,
			html: editorContentHTML,
		} ),
		[ editorContentHTML, editorContentTitle ]
	);

	const cursorState: CursorState | null = useCursorState();

	let blockContent: string | null = null;
	if ( cursorState && 'blockIndex' in cursorState && blocks ) {
		const block = blocks[ cursorState.blockIndex ];
		if ( block ) {
			blockContent = window.wp?.blocks?.serialize( block );
		}
	}

	return {
		currentUserId,
		isLockHolder,
		editorContent,
		blockContent,
		cursorState,
		blocks,
	};
};
