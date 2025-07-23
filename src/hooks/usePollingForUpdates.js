import { useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { pollForUpdates } from '../api';
import { useMultiCursor } from '../useMultiCursor';

export const usePollingForUpdates = (postId, currentUserId) => {
	const pollingState = useRef({
		isPolling: false,
		shouldStop: false,
		lastReceivedTimestamp: 0,
	});
	const awarenessState = useRef({
		all: null, // represents the state of all users
	});

	const { createNotice } = useDispatch('core/notices');
	const { editPost } = useDispatch('core/editor');
	const { updateAwarenessState } = useMultiCursor(currentUserId);

	const startLongPolling = () => {
		if (pollingState.current.isPolling || !window.gce || !postId) {
			return;
		}

		pollingState.current.isPolling = true;

		const longPoll = async () => {
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
			} finally {
				setTimeout(longPoll, 100);
			}
		};

		longPoll();
	};

	useEffect(() => {
		if (currentUserId === null) return;

		if (postId) {
			startLongPolling();
		}

		return () => {
			pollingState.current.shouldStop = true;
		};
	}, [currentUserId, postId]);
}; 