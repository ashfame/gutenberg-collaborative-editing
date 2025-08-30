export type TransportActionType = 'awareness' | 'content';

export interface TransportAction {
	type: TransportActionType;
	payload: any;
}

export interface TransportReceivedData {
	awareness: any;
	content: any;
	modified: boolean;
}

export interface ITransport {
	connect: ( onData: ( data: TransportReceivedData ) => void ) => void;
	send: ( data: TransportAction ) => Promise< void >;
	disconnect: () => void;
}
