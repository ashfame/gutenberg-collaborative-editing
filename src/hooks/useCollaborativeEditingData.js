import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

export const useCollaborativeEditingData = () => {
	const {
		currentUserId,
		isUserLockHolder,
		postId,
		editorContentHTML,
		editorContentTitle,
	} = useSelect( ( select ) => {
		const editorSelect = select( 'core/editor' );
		const coreSelect = select( 'core' );

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();
		const currentUserId = currentUser?.id || null;
		const lockAcquireeUserId = activePostLock
			? parseInt( activePostLock.split( ':' ).pop() )
			: null;

		const isUserLockHolder =
			lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		const postId =
			editorSelect?.getCurrentPostId?.() || window.gce?.postId || 0;

		// Return raw values instead of creating objects
		const editorContentHTML = editorSelect?.getEditedPostContent?.() || '';
		const editorContentTitle =
			editorSelect?.getEditedPostAttribute?.( 'title' ) || '';

		return {
			currentUserId,
			isUserLockHolder,
			postId,
			editorContentHTML,
			editorContentTitle,
		};
	}, [] );

	// Memoize currentContent to prevent unnecessary re-renders
	const currentContent = useMemo(
		() => ( {
			html: editorContentHTML || '',
			title: editorContentTitle || '',
		} ),
		[ editorContentHTML, editorContentTitle ]
	);

	return {
		currentUserId,
		isUserLockHolder,
		postId,
		currentContent,
	};
}; 