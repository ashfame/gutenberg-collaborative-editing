import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { getCursorState } from '../utils';
import { CursorState } from './types';

interface GutenbergState {
	currentUserId: number | null;
	isLockHolder: boolean;
	editorContent: { html: string; title: string };
	blockContent: string | null;
	cursorState: CursorState | null;
}

/**
 * A hook to fetch and consolidate all necessary state from the Gutenberg editor.
 *
 * This hook centralizes all interactions with the `@wordpress/data` store,
 * providing a clean and isolated way to access editor-specific data.
 *
 * @return {GutenbergState}
 */
export const useGutenbergState = (): GutenbergState => {
	const {
		currentUserId,
		isLockHolder,
		editorContentHTML,
		editorContentTitle,
	} = useSelect( ( select ) => {
		const editorSelect = select( 'core/editor' );
		const coreSelect = select( 'core' );

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();
		const currentUserId = currentUser?.id || null;
		const lockHolderId = activePostLock
			? parseInt( activePostLock.split( ':' ).pop() )
			: null;

		// The user who doesn't have the lock can't query the active lock,
		// so we can't get the lock owner. If the lock owner is null,
		// we treat it as a read-only state for the current user.
		const isReadOnly =
			lockHolderId === null ||
			( lockHolderId != null && currentUserId !== lockHolderId );

		const editorContentHTML = editorSelect?.getEditedPostContent?.() || '';
		const editorContentTitle =
			editorSelect?.getEditedPostAttribute?.( 'title' ) || '';

		return {
			currentUserId,
			isLockHolder: ! isReadOnly,
			editorContentHTML,
			editorContentTitle,
		};
	}, [] );

	const editorContent = useMemo(
		() => ( {
			title: editorContentTitle,
			html: editorContentHTML,
		} ),
		[ editorContentHTML, editorContentTitle ]
	);

	const cursorState: CursorState | null = getCursorState();

	let blockContent: string | null = null;
	if ( cursorState && 'blockIndex' in cursorState ) {
		const block = window.wp?.data
			?.select( 'core/block-editor' )
			.getBlocks()[ cursorState.blockIndex ];
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
	};
};
