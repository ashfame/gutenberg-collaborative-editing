export interface User {
    id: number;
    name: string;
    slug: string;
    avatar: string;
}

export interface CursorState {
    blockIndex?: number;
    cursorPos?: number;
    cursorPosStart?: number;
    cursorPosEnd?: number;
    blockIndexStart?: number;
    blockIndexEnd?: number;
}

export interface AwarenessInfo {
    cursor_state: CursorState;
    cursor_ts: number;
    heartbeat_ts: number;
    user_data: User;
    color: string;
}

export interface CollaborativeState {
    isReadOnly: boolean;
    isSynced: boolean;
    lockHolder: User | null;
    awareness: {
        [userId: string]: AwarenessInfo;
    };
}
