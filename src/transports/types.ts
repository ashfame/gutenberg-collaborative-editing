import { AwarenessState, CursorState } from '@/hooks/types';

export type TransportAction = AwarenessTransportAction | ContentTransportAction;

export interface AwarenessTransportAction {
	type: 'awareness';
	payload: CursorState;
}

export interface ContentTransportAction {
	type: 'content';
	payload: ContentSyncPayload;
}

/**
 * ContentSync payload
 */
export type ContentSyncPayload = FullContentSyncPayload | BlockOpsPayload;
export interface FullContentSyncPayload {
	type: 'full';
	payload: string;
}
export interface BlockOpsPayload {
	type: 'ops';
	payload: BlockOpPayload[];
}
export type BlockOpPayload =
	| BlockOpAddPayload
	| BlockOpUpdatePayload
	| BlockOpMovePayload
	| BlockOpDelPayload;
export interface BlockOpAddPayload {
	op: 'insert';
	blockIndex: number;
	blockContent: string; // This could be just empty
	timestamp: number;
}
export interface BlockOpUpdatePayload {
	op: 'update';
	blockIndex: number;
	blockContent: string;
	timestamp: number;
}
export interface BlockOpMovePayload {
	op: 'move';
	fromBlockIndex: number;
	toBlockIndex: number;
	timestamp: number;
}
export interface BlockOpDelPayload {
	op: 'del';
	blockIndex: number;
	timestamp: number;
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
