import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';

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
	const { currentUserId, isUserLockHolder, postId, currentContent } = useSelect((select) => {
		const editorSelect = select('core/editor');
		const coreSelect = select('core');

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();
		const currentUserId = currentUser?.id || null;
		const lockAcquireeUserId = activePostLock ? parseInt(activePostLock.split(':').pop()) : null;
		
		const isUserLockHolder = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		const postId = editorSelect?.getCurrentPostId?.() || window.gceSync?.postId || 0;
		const currentContent = {
			html: editorSelect?.getEditedPostContent?.() || '',
			title: editorSelect?.getEditedPostAttribute?.('title') || ''
		};

		return {
			currentUserId,
			isUserLockHolder,
			postId,
			currentContent
		};
	}, []);

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
			
			if (result.success) {
				console.log('Content synced successfully:', result.data);
			} else {
				console.error('Sync failed:', result.data);
			}

		} catch (error) {
			console.error('Failed to sync content:', error);
		}
	};

	// Poll for content updates (for non-lock holders)
	const pollForUpdates = async () => {
		if (isPolling.current || !window.gceSync || !postId) {
			console.log('Skipping poll - already polling or missing data:', { 
				isPolling: isPolling.current, 
				hasGceSync: !!window.gceSync, 
				postId 
			});
			return;
		}

		isPolling.current = true;
		console.log('Starting long poll request...');

		try {
			const url = new URL(window.gceSync.ajaxUrl);
			url.searchParams.append('action', window.gceSync.pollAction);
			url.searchParams.append('nonce', window.gceSync.nonce);
			url.searchParams.append('post_id', postId);
			url.searchParams.append('last_timestamp', lastReceivedTimestamp.current);

			console.log('Long poll URL:', url.toString());

			const response = await fetch(url.toString(), {
				method: 'GET',
				// Add timeout and other options for better error handling
				cache: 'no-cache',
				headers: {
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache'
				}
			});

			console.log('Long poll response:', response.status, response.statusText);

			if (response.ok) {
				const data = await response.json();
				console.log('Long poll data received:', data);
				
				if (data.success) {
					if (data.data && data.data.has_update && data.data.content) {
						const receivedContent = data.data.content;
						console.log('Applying content update:', receivedContent);
						
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
					} else {
						console.log('No updates available in long poll response');
					}
				} else {
					console.error('Long poll response indicated failure:', data);
				}
			} else {
				console.error('Long poll request failed:', response.status, response.statusText);
				
				// If it's a 4xx error, it might be a nonce issue, let's try to refresh
				if (response.status >= 400 && response.status < 500) {
					console.log('Client error detected, may need to refresh nonce');
				}
			}

		} catch (error) {
			console.error('Long polling error:', error);
			
			// Check if it's a network error
			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				console.log('Network error detected, will retry');
			} else if (error.name === 'AbortError') {
				console.log('Request was aborted, will retry');
			} else {
				console.log('Unknown error during long polling:', error.name, error.message);
			}
			
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
			
			// Send immediately for continuous sync
			syncContentToServer(currentContent);
		}
	};

	// Handle long polling for non-lock holders
	const startLongPolling = () => {
		if (isUserLockHolder || !postId) {
			console.log('Not starting long polling - user has lock or no postId:', { isUserLockHolder, postId });
			return;
		}

		console.log('Starting long polling for post:', postId);
		shouldStopPolling.current = false;

		// Recursive long polling function
		const longPoll = async () => {
			// Check if we should continue polling
			if (shouldStopPolling.current || isUserLockHolder || !postId) {
				console.log('Stopping long polling - conditions changed');
				return;
			}

			console.log('Long polling for updates...', { postId, lastTimestamp: lastReceivedTimestamp.current });
			
			await pollForUpdates();
			
			// Immediately start the next long poll request
			// Add a small delay to prevent overwhelming the server in case of immediate failures
			setTimeout(longPoll, 100);
		};

		// Start the long polling loop
		longPoll();
	};

	// Handle read-only mode when we have user data
	useEffect(() => {
		if (currentUserId === null) return;

		const preventEditing = (e) => {
			// Allow scrolling events
			if (e.type === 'wheel' || e.type === 'scroll') return;
			
			// Prevent all editing interactions
			e.preventDefault();
			e.stopPropagation();
			return false;
		};

		if (isUserLockHolder) {
			// User has the lock - remove notice, hide modal, and remove body class
			removeNotice('read-only-mode');
			setShowModal(false);
			document.body.classList.remove('gutenberg-collaborative-editing-readonly');
			shouldStopPolling.current = true; // Stop any ongoing polling
			
			// Start syncing content changes
			handleContentChange();
		} else {
			// User doesn't have the lock - show notice, add body class, and prevent editing
			createNotice('info', 'Read-only mode', {
				isDismissible: false,
				id: 'read-only-mode'
			});
			setShowModal(true);
			document.body.classList.add('gutenberg-collaborative-editing-readonly');
			disableAutoSave();
			
			// Start long polling for updates
			startLongPolling();
			
			// Add event listeners to prevent editing
			const editorElement = document.querySelector('.editor-visual-editor');
			if (editorElement) {
				// Mouse events
				editorElement.addEventListener('click', preventEditing, true);
				editorElement.addEventListener('mousedown', preventEditing, true);
				editorElement.addEventListener('mouseup', preventEditing, true);
				editorElement.addEventListener('dblclick', preventEditing, true);
				
				// Keyboard events
				editorElement.addEventListener('keydown', preventEditing, true);
				editorElement.addEventListener('keypress', preventEditing, true);
				editorElement.addEventListener('keyup', preventEditing, true);
				
				// Input events
				editorElement.addEventListener('input', preventEditing, true);
				editorElement.addEventListener('change', preventEditing, true);
				editorElement.addEventListener('paste', preventEditing, true);
				editorElement.addEventListener('cut', preventEditing, true);
				editorElement.addEventListener('copy', preventEditing, true);
				
				// Focus events
				editorElement.addEventListener('focus', preventEditing, true);
				editorElement.addEventListener('focusin', preventEditing, true);
				
				// Touch events for mobile
				editorElement.addEventListener('touchstart', preventEditing, true);
				editorElement.addEventListener('touchend', preventEditing, true);
			}
		}

		// Cleanup
		return () => {
			// Stop long polling
			shouldStopPolling.current = true;
			
			// Clear timeouts
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
			
			const editorElement = document.querySelector('.editor-visual-editor');
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
				editorElement.removeEventListener('copy', preventEditing, true);
				editorElement.removeEventListener('focus', preventEditing, true);
				editorElement.removeEventListener('focusin', preventEditing, true);
				editorElement.removeEventListener('touchstart', preventEditing, true);
				editorElement.removeEventListener('touchend', preventEditing, true);
			}
		};
	}, [currentUserId, isUserLockHolder, postId, currentContent, createNotice, removeNotice, editPost]);

	// Cleanup
	useEffect(() => {
		return () => {
			removeNotice('read-only-mode');
			document.body.classList.remove('gutenberg-collaborative-editing-readonly');
			
			// Stop long polling
			shouldStopPolling.current = true;
			
			// Clear all timeouts
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
		};
	}, [removeNotice]);

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
