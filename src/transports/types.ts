export type TransportActionType = 'awareness' | 'content';

export interface TransportAction {
	type: TransportActionType;
	payload: any;
}

export interface ITransport {
	connect: ( onData: ( data: any ) => void ) => void;
	send: ( data: TransportAction ) => Promise< void >;
	disconnect: () => void;
}
