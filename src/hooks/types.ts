// @TODO: Ensure types defs are accurate

/**
 * @typedef {object} User
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {Object<string, string>} avatar_urls
 */

/**
 * @typedef {object} AwarenessInfo
 * @property {object} cursor_state
 * @property {number} cursor_ts
 * @property {number} heartbeat_ts
 * @property {User} user The user associated with this awareness state.
 */

/**
 * @typedef {object} CollaborativeState
 * @property {boolean} isReadOnly
 * @property {boolean} isSynced
 * @property {User | null} lockHolder
 * @property {Object<string, AwarenessInfo>} awareness
 */

/*
// For future TypeScript migration
export interface User {
    id: number;
    name: string;
    slug: string;
    avatar_urls: { [key: string]: string };
}

export interface AwarenessInfo {
    cursor_state: object; // Define more strictly
    cursor_ts: number;
    heartbeat_ts: number;
    user: User;
}

export interface CollaborativeState {
    isReadOnly: boolean;
    isSynced: boolean;
    lockHolder: User | null;
    awareness: {
        [userId: string]: AwarenessInfo;
    };
}
*/ 