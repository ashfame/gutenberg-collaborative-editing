export type BlockId = string;
export type Timestamp = number;

export interface Block {
  clientId: BlockId;
  content?: any;
  metadata?: Record<string, any>;
}

// Operations that can happen to blocks
export type BlockOperation = 
  | { type: 'insert'; index: number; block: Block; timestamp: Timestamp }
  | { type: 'update'; index: number; block: Block; previousBlock: Block; timestamp: Timestamp }
  | { type: 'delete'; index: number; block: Block; timestamp: Timestamp }
  | { type: 'move'; fromIndex: number; toIndex: number; block: Block; timestamp: Timestamp };

// Change tracking status for blocks
export interface TrackedBlock extends Block {
  locallyModified?: boolean;
  locallyAdded?: boolean;
  pendingDelete?: boolean;
  lastSyncedVersion?: Block;
  lastModified?: Timestamp;
}
