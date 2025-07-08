import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useRef, useMemo } from '@wordpress/element';

const preventEditing = (e) => {
	// Allow scrolling events
	if (e.type === 'wheel' || e.type === 'scroll') return;
	
	// Prevent all editing interactions
	e.preventDefault();
	e.stopPropagation();
	return false;
};

export const PostNotLocked = () => {
	const [showModal, setShowModal] = useState(false);
	const syncTimeoutRef = useRef(null);
	const lastSyncContent = useRef('');
	const lastReceivedTimestamp = useRef(0);
	const isPolling = useRef(false);
	const shouldStopPolling = useRef(false);

	const { createNotice, removeNotice } = useDispatch('core/notices');
	const { editPost } = useDispatch('core/editor');

	// Get all required data in a single useSelect
	const { currentUserId, isUserLockHolder, postId, editorContent } = useSelect((select) => {
		const editorSelect = select('core/editor');
		const coreSelect = select('core');

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();
		const currentUserId = currentUser?.id || null;
		const lockAcquireeUserId = activePostLock ? parseInt(activePostLock.split(':').pop()) : null;
		
		const isUserLockHolder = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		const postId = editorSelect?.getCurrentPostId?.() || window.gceSync?.postId || 0;
		
		// Return raw values instead of creating objects
		const editorContent = {
			html: editorSelect?.getEditedPostContent?.() || '',
			title: editorSelect?.getEditedPostAttribute?.('title') || ''
		};

		return {
			currentUserId,
			isUserLockHolder,
			postId,
			editorContent
		};
	}, []);

	// Memoize currentContent to prevent unnecessary re-renders
	const currentContent = useMemo(() => ({
		html: editorContent?.html || '',
		title: editorContent?.title || ''
	}), [editorContent?.html, editorContent?.title]);

	// Sync content to server (for lock holders)
	const syncContentToServer = async (content) => {
		if (!window.gceSync || !postId) return;

		try {
			const formData = new FormData();
			formData.append('action', window.gceSync.syncAction);
			formData.append('nonce', window.gceSync.nonce);
			formData.append('post_id', postId);
			formData.append('content', JSON.stringify(content));

			const response = await fetch(window.gceSync.ajaxUrl, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			if ( !result.success ) {
				throw new Error(result.data.message);
			}

		} catch (error) {
			console.error('Failed to sync content:', error);
		}
	};

	// Poll for content updates (for non-lock holders)
	const pollForUpdates = async () => {
		if (isPolling.current || !window.gceSync || !postId) {
			return;
		}

		isPolling.current = true;

		try {
			const url = new URL(window.gceSync.ajaxUrl);
			url.searchParams.append('action', window.gceSync.pollAction);
			url.searchParams.append('nonce', window.gceSync.nonce);
			url.searchParams.append('post_id', postId);
			url.searchParams.append('last_timestamp', lastReceivedTimestamp.current);

			const response = await fetch(url.toString(), {
				method: 'GET',
				// Add timeout and other options for better error handling
				cache: 'no-cache',
				headers: {
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache'
				}
			});

			if (response.ok) {
				const data = await response.json();
				
				if (data.success) {
					if (data.data && data.data.has_update && data.data.content) {
						const receivedContent = data.data.content;
						
						// Apply content to editor
						if (receivedContent.content && receivedContent.content.html) {
							editPost({
								content: receivedContent.content.html,
								title: receivedContent.content.title || ''
							});
							
							lastReceivedTimestamp.current = receivedContent.timestamp;
							
							// Show notification
							createNotice('info', 'Content updated from collaborator', {
								type: 'snackbar',
								isDismissible: true
							});
						}
					}
				}
			}

		} catch (error) {
			console.error('Long polling error:', error);
			// Don't throw the error, just log it and continue
		} finally {
			isPolling.current = false;
		}
	};

	// Handle content changes for lock holders
	const handleContentChange = () => {
		if (!isUserLockHolder || !postId) return;

		const contentStr = JSON.stringify(currentContent);
		
		if (contentStr !== lastSyncContent.current) {
			lastSyncContent.current = contentStr;
			
			// Clear existing timeout
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
			
			// Schedule sync after 200ms delay
			syncTimeoutRef.current = setTimeout(() => {
				syncContentToServer(currentContent);
			}, 200);
		}
	};

	// Handle long polling for non-lock holders
	const startLongPolling = () => {
		if (isUserLockHolder || !postId) {
			return;
		}

		shouldStopPolling.current = false;

		// Recursive long polling function
		const longPoll = async () => {
			// Check if we should continue polling
			if (shouldStopPolling.current || isUserLockHolder || !postId) {
				return;
			}

			await pollForUpdates();
			
			// Immediately start the next long poll request
			// Add a small delay to prevent overwhelming the server in case of immediate failures
			setTimeout(longPoll, 100);
		};

		// Start the long polling loop
		longPoll();
	};

	// Manage the read-only notice
	useEffect(() => {
		if (currentUserId === null) return;

		if (isUserLockHolder) {
			removeNotice('read-only-mode');
		} else {
			createNotice('info', 'Read-only mode', {
				isDismissible: false,
				id: 'read-only-mode'
			});
		}

		return () => {
			removeNotice('read-only-mode');
		};
	}, [currentUserId, isUserLockHolder, createNotice, removeNotice]);

	// Manage long polling
	useEffect(() => {
		if (currentUserId === null) return;

		if (!isUserLockHolder && postId) {
			startLongPolling();
		}

		return () => {
			shouldStopPolling.current = true;
		};
	}, [currentUserId, isUserLockHolder, postId]);

	// Manage editor read-only state (DOM listeners, CSS class, modal)
	useEffect(() => {
		if (currentUserId === null) return;

		const editorElement = document.querySelector('.editor-visual-editor');

		if (isUserLockHolder) {
			setShowModal(false);
			document.body.classList.remove('gutenberg-collaborative-editing-readonly');
		} else {
			setShowModal(true);
			document.body.classList.add('gutenberg-collaborative-editing-readonly');
			disableAutoSave();
			
			if (editorElement) {
				// Add event listeners to prevent editing
				editorElement.addEventListener('click', preventEditing, true);
				editorElement.addEventListener('mousedown', preventEditing, true);
				editorElement.addEventListener('mouseup', preventEditing, true);
				editorElement.addEventListener('dblclick', preventEditing, true);
				editorElement.addEventListener('keydown', preventEditing, true);
				editorElement.addEventListener('keypress', preventEditing, true);
				editorElement.addEventListener('keyup', preventEditing, true);
				editorElement.addEventListener('input', preventEditing, true);
				editorElement.addEventListener('change', preventEditing, true);
				editorElement.addEventListener('paste', preventEditing, true);
				editorElement.addEventListener('cut', preventEditing, true);
				editorElement.addEventListener('copy', preventEditing, true,);
				editorElement.addEventListener('focus', preventEditing, true);
				editorElement.addEventListener('focusin', preventEditing, true);
				editorElement.addEventListener('touchstart', preventEditing, true);
				editorElement.addEventListener('touchend', preventEditing, true);
			}
		}

		return () => {
			document.body.classList.remove('gutenberg-collaborative-editing-readonly');

			if (editorElement) {
				// Remove all event listeners
				editorElement.removeEventListener('click', preventEditing, true);
				editorElement.removeEventListener('mousedown', preventEditing, true);
				editorElement.removeEventListener('mouseup', preventEditing, true);
				editorElement.removeEventListener('dblclick', preventEditing, true);
				editorElement.removeEventListener('keydown', preventEditing, true);
				editorElement.removeEventListener('keypress', preventEditing, true);
				editorElement.removeEventListener('keyup', preventEditing, true);
				editorElement.removeEventListener('input', preventEditing, true);
				editorElement.removeEventListener('change', preventEditing, true);
				editorElement.removeEventListener('paste', preventEditing, true);
				editorElement.removeEventListener('cut', preventEditing, true);
				editorElement.removeEventListener('copy', preventEditing, true,);
				editorElement.removeEventListener('focus', preventEditing, true);
				editorElement.removeEventListener('focusin', preventEditing, true);
				editorElement.removeEventListener('touchstart', preventEditing, true);
				editorElement.removeEventListener('touchend', preventEditing, true);
			}
		};
	}, [currentUserId, isUserLockHolder]);

	// Handle content changes for lock holders (separate effect)
	useEffect(() => {
		if (isUserLockHolder && postId) {
			handleContentChange();
		}
	}, [isUserLockHolder, postId, currentContent]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
		};
	}, []);

	// Don't render anything if user data not loaded or user has lock
	if (currentUserId === null || isUserLockHolder) {
		return null;
	}

	return showModal ? (
		<Modal
			className="gutenberg-collaborative-editing-read-only-modal"
			title={__('READ_ONLY', 'gutenberg-collaborative-editing')}
			onRequestClose={() => setShowModal(false)}
		>
			<p>
				Someone else is editing this post right now. So, for now, you only have read-only access to this post.
			</p>
			<Button variant="primary" onClick={() => setShowModal(false)}>
				Okay
			</Button>
		</Modal>
	) : null;
};

function disableAutoSave() {
	wp.data.dispatch('core/editor').updateEditorSettings({
		autosaveInterval: 999999,
		localAutosaveInterval: 999999,
		__experimentalLocalAutosaveInterval: 999999
	});
}
