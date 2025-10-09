export type CollaborationMode = 'BLOCK-LEVEL-LOCKS' | 'READ-ONLY-FOLLOW';

export type CursorState =
	| CollapsedCursorState
	| SingleBlockSelectionCursorState
	| MultiBlockSelectionCursorState;

// Cursor State 1: A simple cursor position in a block.
export interface CollapsedCursorState {
	blockIndex: number;
	cursorPos: number;
}

// Cursor State 2: A selection within a single block.
export interface SingleBlockSelectionCursorState {
	blockIndex: number;
	cursorPosStart: number;
	cursorPosEnd: number;
}

// Cursor State 3: A selection spanning multiple blocks.
export interface MultiBlockSelectionCursorState {
	blockIndexStart: number;
	blockIndexEnd: number;
	cursorPosStart: number;
	cursorPosEnd: number;
}

export interface User {
	id: UserId;
	name: string;
	slug: string;
	avatar: string;
}

export type UserId = number;

export interface UserAwareness {
	cursor_state: CursorState;
	cursor_ts: number; // timestamp for cursor state
	block_ts: number; // timestamp for when the current block was engaged
	heartbeat_ts: number;
	user_data: User;
	color: string;
}

export interface AwarenessState {
	[ userId: number ]: UserAwareness;
}

export interface DataManagerState {
	isLockHolder: boolean;
	awareness: AwarenessState;
	activeUsers: AwarenessState;
	otherUsers: AwarenessState;
	otherActiveUsers: AwarenessState;
}
