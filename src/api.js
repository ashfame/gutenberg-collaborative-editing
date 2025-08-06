import { getCursorState, needCursorStateBroadcast } from './utils';

/**
 * @typedef {import('./utils').CursorState} CursorState
 */

/**
 * Syncs the editor content to the server.
 *
 * @param {number} postId  The ID of the post.
 * @param {object} content The content to sync.
 * @returns {Promise<void>}
 * @throws {Error} If the sync fails.
 */
export const syncContent = async (postId, content) => {
	if (!window.gce || !postId) return;

	try {
		const formData = new FormData();
		formData.append('action', window.gce.syncContentAction);
		formData.append('nonce', window.gce.syncContentNonce);
		formData.append('post_id', postId);
		formData.append('fingerprint', window.gce.fingerprint);
		formData.append('content', JSON.stringify(content));

		const response = await fetch(window.gce.ajaxUrl, {
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
		throw error;
	}
};

/**
 * Syncs the user's awareness state (e.g., cursor position) to the server.
 *
 * @param {number}           postId               The ID of the post.
 * @param {CursorState|null} lastBroadcastedState The last broadcasted awareness state for the current user.
 * @returns {Promise<CursorState|null>} The new cursor state if it was synced, otherwise null.
 * @throws {Error} If the sync fails.
 */
export const syncAwareness = async (postId, lastBroadcastedState) => {
	if (!window.gce || !postId) return null;

	const cursorState = getCursorState();
	if ( !cursorState ) {
		return null;
	}

	// Only sync if awareness data has changed.
	if ( !needCursorStateBroadcast(cursorState, lastBroadcastedState) ) {
		return null;
	}

	try {
		const formData = new FormData();
		formData.append('action', window.gce.syncAwarenessAction);
		formData.append('nonce', window.gce.syncAwarenessNonce);
		formData.append('post_id', postId);
		formData.append('cursor_state', JSON.stringify(cursorState));

		const response = await fetch(window.gce.ajaxUrl, {
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

		return cursorState;
	} catch (error) {
		console.error('Failed to sync awareness:', error);
		throw error;
	}
};

/**
 * Polls the server for content and awareness updates.
 *
 * @param {number} postId         The ID of the post.
 * @param {number} lastTimestamp  The timestamp of the last received content update.
 * @param {object} awarenessData  The current awareness data of all users.
 * @returns {Promise<object|null>} The data from the server, or null if there are no updates.
 * @throws {Error} If the polling request fails.
 */
export const pollForUpdates = async (postId, lastTimestamp, awarenessData) => {
	if (!window.gce || !postId) return null;

	try {
		const url = new URL(window.gce.ajaxUrl);
		url.searchParams.append('action', window.gce.pollAction);
		url.searchParams.append('nonce', window.gce.pollNonce);
		url.searchParams.append('post_id', postId);
		url.searchParams.append('fingerprint', window.gce.fingerprint);
		url.searchParams.append('last_timestamp', lastTimestamp);
		url.searchParams.append('awareness', JSON.stringify(awarenessData));

		const response = await fetch(url.toString(), {
			method: 'GET',
			cache: 'no-cache',
			headers: {
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache'
			}
		});

		if (response.status === 204) {
			return null;
		}

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		if ( !result.success ) {
			throw new Error(result.data?.message || 'Polling request was not successful.');
		}

		return result.data;
	} catch (error) {
		console.error('Long polling error:', error);
		// Re-throw the error to be caught by the caller
		throw error;
	}
}; 