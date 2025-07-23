import { useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { syncAwareness, pollForUpdates } from '../api';
import { useMultiCursor } from '../useMultiCursor';

export const useAwarenessAndPolling = (
	postId,
	currentUserId,
	isUserLockHolder
) => {
	const pollingState = useRef({
		isPolling: false,
		shouldStop: false,
		lastReceivedTimestamp: 0,
	});
	const awarenessState = useRef({
		all: null, // represents the state of all users
		self: null, // represents the last broadcasted cursor state for the current user
	});

	const { createNotice } = useDispatch('core/notices');
	const { editPost } = useDispatch('core/editor');
	const { updateAwarenessState } = useMultiCursor(currentUserId);

	// Manage awareness data synchronization
	useEffect(() => {
		if (currentUserId === null || !postId) {
			return;
		}

		const doSync = async () => {
			try {
				const newState = await syncAwareness(
					postId,
					awarenessState.current.self
				);
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
				const data = await pollForUpdates(
					postId,
					pollingState.current.lastReceivedTimestamp,
					awarenessState.current.all
				);

				if (data) {
					if (data.modified && data.content) {
						const receivedContent = data.content;

						// Apply content to editor
						if (
							receivedContent.content &&
							receivedContent.content.html
						) {
							editPost({
								content: receivedContent.content.html,
								title: receivedContent.content.title || '',
							});

							pollingState.current.lastReceivedTimestamp =
								receivedContent.timestamp;

							createNotice(
								'info',
								'Content updated from collaborator',
								{
									type: 'snackbar',
									isDismissible: true,
								}
							);
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
					isDismissible: true,
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
}; 