import { Block } from '@/block-sync';

/**
 * Represents a snapshot of a block at a specific moment.
 */
export interface BlockSnapshot extends Block {
	/**
	 * The block's index in the block list.
	 */
	index: number;
}

/**
 * Represents a single operation in the undo/redo history.
 */
export interface UndoHistoryItem {
	/**
	 * The client ID of the block that was affected.
	 */
	clientId: string;

	/**
	 * The state of the block before the change.
	 * `null` if the block was newly inserted.
	 */
	before: BlockSnapshot | null;

	/**
	 * The state of the block after the change.
	 * `null` if the block was deleted.
	 */
	after: BlockSnapshot | null;
}
