// @TODO: Ensure types defs are accurate

/**
 * @typedef { 'awareness' | 'content' } TransportActionType
 */

/**
 * @typedef {object} TransportAction
 * @property {TransportActionType} type The type of action.
 * @property {any} payload The data payload.
 */

/**
 * @callback onDataReceivedCallback
 * @param {any} data - The data received from the server.
 */

/**
 * @typedef {object} ITransport
 * @property {(onData: onDataReceivedCallback) => void} connect - Initializes the connection to the server.
 * @property {(data: TransportAction) => Promise<void>} send - Sends data to the server.
 * @property {() => void} disconnect - Terminates the connection.
 */

/*
// For future TypeScript migration
export type TransportActionType = 'awareness' | 'content' | 'lock';

export interface TransportAction {
	type: TransportActionType;
	payload: any;
}

export interface ITransport {
	connect( onData: ( data: any ) => void ): void;
	send( data: TransportAction ): Promise<void>;
	disconnect(): void;
}
*/
