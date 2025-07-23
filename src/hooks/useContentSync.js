import { useRef, useEffect } from '@wordpress/element';
import { syncContent } from '../api';

export const useContentSync = (postId, currentContent, isUserLockHolder) => {
	const syncState = useRef({
		timeoutId: null,
		lastContent: '',
	});

	const handleContentChange = () => {
		if (!isUserLockHolder || !postId) return;

		const contentStr = JSON.stringify(currentContent);

		if (contentStr !== syncState.current.lastContent) {
			syncState.current.lastContent = contentStr;

			// Clear existing timeout
			if (syncState.current.timeoutId) {
				clearTimeout(syncState.current.timeoutId);
			}

			// Schedule sync after 200ms delay
			syncState.current.timeoutId = setTimeout(() => {
				syncContent(postId, currentContent);
			}, 200);
		}
	};

	useEffect(() => {
		if (isUserLockHolder && postId) {
			handleContentChange();
		}
	}, [isUserLockHolder, postId, currentContent]);

	useEffect(() => {
		return () => {
			if (syncState.current.timeoutId) {
				clearTimeout(syncState.current.timeoutId);
			}
		};
	}, []);
}; 