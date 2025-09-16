export type BlockId = string;
export type Timestamp = number;

export interface Block {
	clientId: BlockId;
	content?: any;
	metadata?: Record< string, any >;
}

// Operations that can happen to blocks
export type InsertBlockOperation = {
	type: 'insert';
	index: number;
	block: Block;
	timestamp: Timestamp;
};

export type UpdateBlockOperation = {
	type: 'update';
	index: number;
	block: Block;
	previousBlock: Block;
	timestamp: Timestamp;
};

export type DeleteBlockOperation = {
	type: 'delete';
	index: number;
	block: Block;
	timestamp: Timestamp;
};

export type MoveBlockOperation = {
	type: 'move';
	fromIndex: number;
	toIndex: number;
	block: Block;
	timestamp: Timestamp;
};

export type BlockOperation =
	| InsertBlockOperation
	| UpdateBlockOperation
	| DeleteBlockOperation
	| MoveBlockOperation;

// Change tracking status for blocks
export interface TrackedBlock extends Block {
	locallyModified?: boolean;
	locallyAdded?: boolean;
	pendingDelete?: boolean;
	lastSyncedVersion?: Block;
	lastModified?: Timestamp;
}
