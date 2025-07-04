import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';

export const PostNotLocked = () => {
	const [showModal, setShowModal] = useState(false);
	const syncTimeoutRef = useRef(null);
	const pollTimeoutRef = useRef(null);
	const lastSyncContent = useRef('');
	const lastReceivedTimestamp = useRef(0);
	const isPolling = useRef(false);

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
			const response = await fetch(window.gceSync.syncUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.gceSync.nonce
				},
				body: JSON.stringify({
					post_id: postId,
					content: content
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log('Content synced successfully:', result);

		} catch (error) {
			console.error('Failed to sync content:', error);
		}
	};

	// Poll for content updates (for non-lock holders)
	const pollForUpdates = async () => {
		if (isPolling.current || !window.gceSync || !postId) return;

		isPolling.current = true;

		try {
			const url = new URL(window.gceSync.syncUrl);
			url.searchParams.append('post_id', postId);
			url.searchParams.append('last_timestamp', lastReceivedTimestamp.current);

			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					'X-WP-Nonce': window.gceSync.nonce
				}
			});

			if (response.ok) {
				const data = await response.json();
				
				if (data.success && data.has_update && data.content) {
					const receivedContent = data.content;
					
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

		} catch (error) {
			console.error('Polling error:', error);
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

	// Handle polling for non-lock holders
	const startPolling = () => {
		if (isUserLockHolder || !postId) return;

		const poll = async () => {
			await pollForUpdates();
			
			// Schedule next poll
			pollTimeoutRef.current = setTimeout(poll, 2000); // Poll every 2 seconds
		};

		poll();
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
			
			// Start polling for updates
			startPolling();
			
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
			// Clear timeouts
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
			if (pollTimeoutRef.current) {
				clearTimeout(pollTimeoutRef.current);
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
			
			// Clear all timeouts
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
			if (pollTimeoutRef.current) {
				clearTimeout(pollTimeoutRef.current);
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
