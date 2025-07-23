import { useEffect, useRef } from '@wordpress/element';
import { syncAwareness } from '../api';

export const useAwarenessSync = (postId, currentUserId, isUserLockHolder) => {
	const awarenessState = useRef({
		self: null, // represents the last broadcasted cursor state for the current user
	});

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
}; 