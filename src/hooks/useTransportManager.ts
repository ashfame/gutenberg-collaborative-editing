import { useEffect, useRef, useCallback } from '@wordpress/element';
import { AjaxWithLongPollingTransport } from '../transports/AjaxWithLongPolling';
import { TransportAction } from '../transports/types';

const transportFactory: { [ key: string ]: any } = {
	'ajax-with-long-polling': AjaxWithLongPollingTransport,
	// More transports can be added here
};

interface UseTransportManagerConfig {
	transport: string;
	postId: number;
	onDataReceived: ( data: any ) => void;
}

/**
 * Manages the data transport layer for the collaborative editing session.
 *
 * This hook is responsible for instantiating the correct transport based on configuration,
 * managing its connection lifecycle, and providing a stable interface for sending data.
 *
 * @param {object}   config
 * @param {string}   config.transport   - The key for the transport to use (e.g., 'long-polling').
 * @param {number}   config.postId      - The ID of the post being edited.
 * @param {Function} config.onDataReceived - Callback function to handle data from the transport.
 * @returns {{
 *   send: (data: any) => void
 * }}
 */
export const useTransportManager = ( {
	transport,
	postId,
	onDataReceived,
}: UseTransportManagerConfig ) => {
	const transportRef = useRef( null );

	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		const Transport = transportFactory[ transport ];
		if ( ! Transport ) {
			// eslint-disable-next-line no-console
			console.error( `Invalid transport: ${ transport }` );
			return;
		}

		const transportInstance = Transport( { postId: postId } );
		transportRef.current = transportInstance;

		transportInstance.connect( onDataReceived );

		return () => {
			transportInstance.disconnect();
		};
	}, [ transport, postId, onDataReceived ] );

	const send = useCallback( ( data: TransportAction ) => {
		if ( transportRef.current ) {
			transportRef.current.send( data );
		}
	}, [] );

	return {
		send,
	};
};
