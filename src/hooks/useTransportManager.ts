import { useEffect, useRef, useCallback } from '@wordpress/element';
import { AjaxWithLongPollingTransport } from '@/transports/AjaxWithLongPolling';
import {
	ITransport,
	TransportAction,
	TransportReceivedData,
} from '@/transports/types';

export type OnDataReceivedCallback< T > = ( data: T ) => void;

const transportFactory: { [ key: string ]: any } = {
	'ajax-with-long-polling': AjaxWithLongPollingTransport,
	// More transports can be added here
};

export interface UseTransportManagerConfig< T > {
	transport: string;
	postId: number;
	onDataReceived: OnDataReceivedCallback< T >;
}

/**
 * Manages the data transport layer for the collaborative editing session.
 *
 * This hook is responsible for instantiating the correct transport based on configuration,
 * managing its connection lifecycle, and providing a stable interface for sending data.
 *
 * @param {Object}   config
 * @param {string}   config.transport      - The key for the transport to use (e.g., 'long-polling').
 * @param {number}   config.postId         - The ID of the post being edited.
 * @param {Function} config.onDataReceived - Callback function to handle data from the transport.
 * @return {{send: (data: any) => void}} An object containing the send function.
 */
export const useTransportManager = < T >( {
	transport,
	postId,
	onDataReceived,
}: UseTransportManagerConfig< T > ): { send: ( data: any ) => void } => {
	const transportRef = useRef< ITransport | null >( null );

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

		const transportInstance = Transport( { postId } );
		transportRef.current = transportInstance;

		const timeoutId = setTimeout( () => {
			transportInstance.connect(
				onDataReceived as ( data: TransportReceivedData ) => void
			);
		}, 100 );

		return () => {
			clearTimeout( timeoutId );
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
