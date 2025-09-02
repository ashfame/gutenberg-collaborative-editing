import { AwarenessState, CursorState } from '../hooks/types';

export type TransportAction = ContentTransportAction | AwarenessTransportAction;

export interface ContentTransportAction {
	type: 'content';
	payload: ContentSyncPayload;
}

export interface AwarenessTransportAction {
	type: 'awareness';
	payload: CursorState;
}

export interface ContentSyncPayload {
	content: string;
	blockIndex: number;
}

export interface TransportReceivedData {
	awareness: AwarenessState;
	content: TransportReceivedDataContent | null;
	modified: boolean;
}

export interface TransportReceivedDataContent {
	content: {
		title: string;
		html: string;
	};
	timestamp: number;
}

export interface ITransport {
	connect: ( onData: ( data: TransportReceivedData ) => void ) => void;
	send: ( data: TransportAction ) => Promise< void >;
	disconnect: () => void;
}
