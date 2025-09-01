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
	id: number;
	name: string;
	slug: string;
	avatar: string;
}

export interface UserAwarenessInfo {
	cursor_state: CursorState;
	cursor_ts: number;
	heartbeat_ts: number;
	user_data: User;
	color: string;
}

export interface UsersAwarenessInfo {
	[ userId: number ]: UserAwarenessInfo;
}
