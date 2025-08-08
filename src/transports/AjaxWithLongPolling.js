import { pollForUpdates, syncContent, syncAwareness } from '../api';

/**
 * Creates a Long Polling transport layer.
 *
 * @param {object} postId The initial data for the transport.
 * @returns {import('./types').ITransport} An ITransport-compliant object.
 */
export const AjaxWithLongPollingTransport = ( { postId } ) => {
	const state = {
		isPolling: false,
		shouldStop: false,
		lastReceivedTimestamp: 0,
		onDataReceived: null,
		awarenessState: null, // This will hold the awareness state from the last poll.
	};

	const longPoll = async () => {
		if ( state.shouldStop ) {
			state.isPolling = false;
			return;
		}

		try {
			const data = await pollForUpdates(
				postId,
				state.lastReceivedTimestamp,
				state.awarenessState // Send the last known awareness state.
			);

			if ( data ) {
				state.onDataReceived( data );

				// Update local state for later calls
				if ( data.awareness ) {
					state.awarenessState = data.awareness;
				}
				if ( data.modified ) {
					if ( data.content?.timestamp ) {
						state.lastReceivedTimestamp = data.content.timestamp;
					}
				}
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Long polling error:', error );
		} finally {
			setTimeout( longPoll, 100 );
		}
	};

	return {
		connect: ( onDataReceivedCallback ) => {
			if ( state.isPolling ) {
				return;
			}
			if ( onDataReceivedCallback ) {
				state.onDataReceived = onDataReceivedCallback;
			} else {
				console.error( 'callback for receiving data is missing from Transport' );
			}
			state.isPolling = true;
			longPoll();
		},

		/**
		 * @param {import('./types').TransportAction} action
		 */
		send: async ( action ) => {
			switch ( action.type ) {
				case 'content':
					return syncContent( postId, action.payload );
				case 'awareness':
					await syncAwareness( postId, action.payload );
					return;
				default:
					return Promise.resolve();
			}
		},

		disconnect: () => {
			state.shouldStop = true;
		},
	};
};
