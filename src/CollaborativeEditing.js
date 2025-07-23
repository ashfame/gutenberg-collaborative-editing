import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useRef, useMemo } from '@wordpress/element';
import { useMultiCursor } from './useMultiCursor';
import { preventEditing, disableAutoSave } from './utils';
import { syncContent, syncAwareness, pollForUpdates } from './api';

export const CollaborativeEditing = () => {
	const [showModal, setShowModal] = useState(false);
	const syncState = useRef({
		timeoutId: null,
		lastContent: '',
	});
	const pollingState = useRef({
		isPolling: false,
		shouldStop: false,
		lastReceivedTimestamp: 0,
	});
	const awarenessState = useRef({
		all: null, // represents the state of all users
		self: null, // represents the last broadcasted cursor state for the current user
	});

	const { createNotice, removeNotice } = useDispatch('core/notices');
	const { editPost } = useDispatch('core/editor');

	// Get all required data in a single useSelect
	const { currentUserId, isUserLockHolder, postId, editorContentHTML, editorContentTitle } = useSelect((select) => {
		const editorSelect = select('core/editor');
		const coreSelect = select('core');

		const activePostLock = editorSelect?.getActivePostLock?.();
		const currentUser = coreSelect?.getCurrentUser?.();
		const currentUserId = currentUser?.id || null;
		const lockAcquireeUserId = activePostLock ? parseInt(activePostLock.split(':').pop()) : null;

		const isUserLockHolder = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		const postId = editorSelect?.getCurrentPostId?.() || window.gce?.postId || 0;

		// Return raw values instead of creating objects
		const editorContentHTML = editorSelect?.getEditedPostContent?.() || '';
		const editorContentTitle = editorSelect?.getEditedPostAttribute?.('title') || '';

		return {
			currentUserId,
			isUserLockHolder,
			postId,
			editorContentHTML,
			editorContentTitle,
		};
	}, []);

	const { updateAwarenessState } = useMultiCursor(currentUserId);

	// Memoize currentContent to prevent unnecessary re-renders
	const currentContent = useMemo(() => ({
		html: editorContentHTML || '',
		title: editorContentTitle || ''
	}), [editorContentHTML, editorContentTitle]);

	// Manage awareness data synchronization
	useEffect(() => {
		if (currentUserId === null || !postId) {
			return;
		}

		const doSync = async () => {
			try {
				const newState = await syncAwareness(postId, awarenessState.current.self);
				if (newState) {
					awarenessState.current.self = newState;
				}
			} catch (error) {
				// The error is already logged in the syncAwareness function.
			}
		};

		// Sync awareness data at different intervals depending on whether the user
		// is the lock holder or not.
		const interval = isUserLockHolder ? 1000 : 1000; // Eg: 1 second for editor, 3 for viewer

		const awarenessIntervalId = setInterval(doSync, interval);

		// Clean up the interval on component unmount or when dependencies change.
		return () => {
			clearInterval(awarenessIntervalId);
		};
	}, [currentUserId, isUserLockHolder, postId]);

	// Poll for updates: content and awareness updates for non-lock holders and just awareness updates for lock holders
	const startLongPolling = () => {
		if (pollingState.current.isPolling || !window.gce || !postId) {
			return;
		}

		pollingState.current.isPolling = true;

		// Recursive long polling function
		const longPoll = async () => {
			// Check if we should continue polling
			if (pollingState.current.shouldStop || !postId) {
				pollingState.current.isPolling = false;
				return;
			}

			try {
				const data = await pollForUpdates(postId, pollingState.current.lastReceivedTimestamp, awarenessState.current.all);

				if (data) {
					if (data.modified && data.content) {
						const receivedContent = data.content;

						// Apply content to editor
						if (receivedContent.content && receivedContent.content.html) {
							editPost({
								content: receivedContent.content.html,
								title: receivedContent.content.title || ''
							});

							pollingState.current.lastReceivedTimestamp = receivedContent.timestamp;

							createNotice('info', 'Content updated from collaborator', {
								type: 'snackbar',
								isDismissible: true
							});
						}
					}

					if (data.awareness) {
						awarenessState.current.all = data.awareness;
						if (updateAwarenessState) {
							updateAwarenessState(data.awareness);
						}
					}
				}
			} catch (error) {
				createNotice('error', 'Long polling error', {
					type: 'snackbar',
					isDismissible: true
				});
				// Error is already logged in pollForUpdates
			} finally {
				// Immediately start the next long poll request
				// Add a small delay to prevent overwhelming the server in case of immediate failures
				setTimeout(longPoll, 100);
			}
		};

		// Start the long polling loop
		longPoll();
	};

	// Handle content changes for lock holders
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

	// Manage long polling
	useEffect(() => {
		if (currentUserId === null) return;

		if (postId) {
			startLongPolling();
		}

		return () => {
			pollingState.current.shouldStop = true;
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
			if (syncState.current.timeoutId) {
				clearTimeout(syncState.current.timeoutId);
			}
		};
	}, []);

	// Don't render anything if user data not loaded or user has lock
	if (currentUserId === null || isUserLockHolder) {
		return null;
	}

	if (!showModal) {
		return null;
	}

	return (
		<Modal
			className="gutenberg-collaborative-editing-read-only-modal"
			title={__('Read-Only Mode', 'gutenberg-collaborative-editing')}
			onRequestClose={() => setShowModal(false)}
		>
			<p>
				{ __(
					'Someone else is currently editing this post. You can only view the post content.',
					'gutenberg-collaborative-editing'
				) }
			</p>
			<Button variant="primary" onClick={() => setShowModal(false)}>
				Okay
			</Button>
		</Modal>
	)
};
