import { pollForUpdates, syncContent, syncAwareness } from '../api';
import { ITransport, TransportAction } from './types';

/**
 * Creates a Long Polling transport layer.
 *
 * @param {number} postId The initial data for the transport.
 * @return {import('./types').ITransport} An ITransport-compliant object.
 */
export const AjaxWithLongPollingTransport = ( {
	postId,
}: {
	postId: number;
} ): ITransport => {
	const state: {
		isPolling: boolean;
		shouldStop: boolean;
		lastReceivedTimestamp: number;
		onDataReceived: ( ( data: any ) => void ) | null;
		awarenessState: any | null;
	} = {
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
				if ( state.onDataReceived ) {
					state.onDataReceived( data );
				}

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
				// eslint-disable-next-line no-console
				console.error(
					'callback for receiving data is missing from Transport'
				);
			}
			state.isPolling = true;
			longPoll();
		},

		/**
		 * @param {import('./types').TransportAction} action
		 */
		send: async ( action: TransportAction ): Promise< void > => {
			switch ( action.type ) {
				case 'content': {
					await syncContent(
						postId,
						action.payload.content,
						action.payload.blockIndex
					);
					return;
				}
				case 'awareness': {
					await syncAwareness( postId, action.payload );
					return;
				}
				default:
					return Promise.resolve();
			}
		},

		disconnect: () => {
			state.shouldStop = true;
		},
	};
};
