import logger from './logger';
import { CursorState } from './hooks/types';
import { ContentSyncPayload, TransportReceivedData } from './transports/types';

/**
 * Syncs the editor content to the server.
 *
 * @param {number} postId  The ID of the post.
 * @param          payload
 * @return {Promise<void>}
 * @throws {Error} If the sync fails.
 */
export const syncContent = async (
	postId: number,
	payload: ContentSyncPayload
): Promise< void > => {
	if ( ! window.gce || ! postId ) {
		return;
	}

	logger.debug( 'syncContent called with:', payload );

	try {
		const formData = new FormData();
		formData.append( 'action', window.gce.syncContentAction );
		formData.append( 'nonce', window.gce.syncContentNonce );
		formData.append( 'post_id', String( postId ) );
		formData.append( 'fingerprint', window.gce.fingerprint );
		formData.append( 'payloadType', payload.type );

		// Handle the payload based on its type.
		if ( payload.type === 'full' ) {
			// This is a FullContentSyncPayload.
			formData.append( 'payload', payload.payload );
		} else if ( payload.type === 'ops' ) {
			// This is a BlockOpPayload.
			formData.append( 'payload', JSON.stringify( payload.payload ) );
		}

		const response = await fetch( window.gce.ajaxUrl, {
			method: 'POST',
			body: formData,
		} );

		if ( ! response.ok ) {
			throw new Error( `HTTP error! status: ${ response.status }` );
		}

		const result = await response.json();
		if ( ! result.success ) {
			throw new Error( result.data.message );
		}
		window.gce.snapshotId = result.data.snapshot_id;
		logger.debug( 'syncContent successful:', result.data );
	} catch ( error ) {
		logger.error( 'Failed to sync content:', error );
		throw error;
	}
};

/**
 * Syncs the user's awareness state (e.g., cursor position) to the server.
 *
 * @param {number}      postId      The ID of the post.
 * @param {CursorState} cursorState The cursor state to sync.
 * @return {Promise<CursorState|null>} The new cursor state if it was synced, otherwise null.
 * @throws {Error} If the sync fails.
 */
export const syncAwareness = async (
	postId: number,
	cursorState: CursorState
): Promise< CursorState | null > => {
	if ( ! window.gce || ! postId ) {
		return null;
	}

	logger.debug( 'syncAwareness called with cursorState:', cursorState );

	try {
		const formData = new FormData();
		formData.append( 'action', window.gce.syncAwarenessAction );
		formData.append( 'nonce', window.gce.syncAwarenessNonce );
		formData.append( 'post_id', String( postId ) );
		formData.append( 'cursor_state', JSON.stringify( cursorState ) );

		const response = await fetch( window.gce.ajaxUrl, {
			method: 'POST',
			body: formData,
		} );

		if ( ! response.ok ) {
			throw new Error( `HTTP error! status: ${ response.status }` );
		}

		const result = await response.json();
		if ( ! result.success ) {
			throw new Error( result.data.message );
		}

		return cursorState;
	} catch ( error ) {
		logger.error( 'Failed to sync awareness:', error );
		throw error;
	}
};

/**
 * Polls the server for content and awareness updates.
 *
 * @param {number} postId        The ID of the post.
 * @param {number} lastTimestamp The timestamp of the last received content update.
 * @param {Object} awarenessData The current awareness data of all users.
 * @return {Promise<TransportReceivedData|null>} The data from the server, or null if there are no updates.
 * @throws {Error} If the polling request fails.
 */
export const pollForUpdates = async (
	postId: number,
	lastTimestamp: number,
	awarenessData: any
): Promise< TransportReceivedData | null > => {
	if ( ! window.gce || ! postId ) {
		return null;
	}

	logger.debug( 'pollForUpdates called with:', {
		lastTimestamp,
		awarenessData,
	} );

	try {
		const url = new URL( window.gce.ajaxUrl );
		url.searchParams.append( 'action', window.gce.pollAction );
		url.searchParams.append( 'nonce', window.gce.pollNonce );
		url.searchParams.append( 'post_id', String( postId ) );
		url.searchParams.append( 'fingerprint', window.gce.fingerprint );
		url.searchParams.append( 'last_timestamp', String( lastTimestamp ) );
		url.searchParams.append( 'awareness', JSON.stringify( awarenessData ) );

		const response = await fetch( url.toString(), {
			method: 'GET',
			cache: 'no-cache',
			headers: {
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
			},
		} );

		if ( response.status === 204 ) {
			return null;
		}

		if ( ! response.ok ) {
			throw new Error( `HTTP error! status: ${ response.status }` );
		}

		const result = await response.json();
		if ( ! result.success ) {
			throw new Error(
				result.data?.message || 'Polling request was not successful.'
			);
		}

		logger.debug( 'pollForUpdates successful:', result.data );
		return result.data;
	} catch ( error ) {
		logger.error( 'Long polling error:', error );
		throw error;
	}
};
