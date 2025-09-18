import { Block, BlockId, BlockOperation, TrackedBlock } from './types';

/**
 * Tracks changes in the local editor and determines what operations occurred
 * by comparing snapshots of block states
 */
export class BlockChangeTracker {
	private previousSnapshot: Map< BlockId, { block: Block; index: number } > =
		new Map();
	private currentBlocks: TrackedBlock[] = [];
	private pendingOperations: BlockOperation[] = [];

	constructor( initialBlocks: Block[] = [] ) {
		this.currentBlocks = initialBlocks.map( ( b ) => ( { ...b } ) );
		this.takeSnapshot();
	}

	/**
	 * Take a snapshot of current state for comparison
	 */
	private takeSnapshot(): void {
		this.previousSnapshot.clear();
		this.currentBlocks.forEach( ( block, index ) => {
			this.previousSnapshot.set( block.clientId, {
				block: { ...block },
				index,
			} );
		} );
	}

	/**
	 * Update blocks from the editor and detect what changed
	 * @param editorBlocks
	 */
	updateFromEditor( editorBlocks: Block[] ): BlockOperation[] {
		const operations: BlockOperation[] = [];
		const timestamp = Date.now();

		// Create maps for efficient lookups
		const newBlocksMap = new Map<
			BlockId,
			{ block: Block; index: number }
		>();
		editorBlocks.forEach( ( block, index ) => {
			newBlocksMap.set( block.clientId, { block, index } );
		} );

		// Detect deletions and moves
		this.previousSnapshot.forEach( ( { block, index }, clientId ) => {
			if ( ! newBlocksMap.has( clientId ) ) {
				// Block was deleted
				operations.push( {
					type: 'delete',
					index,
					block,
					timestamp,
				} );
			} else {
				const newData = newBlocksMap.get( clientId )!;
				if ( newData.index !== index ) {
					// Block was moved
					operations.push( {
						type: 'move',
						fromIndex: index,
						toIndex: newData.index,
						block: newData.block,
						timestamp,
					} );
				}
			}
		} );

		// Detect insertions and updates
		newBlocksMap.forEach( ( { block, index }, clientId ) => {
			const previous = this.previousSnapshot.get( clientId );

			if ( ! previous ) {
				// New block inserted
				operations.push( {
					type: 'insert',
					index,
					block,
					timestamp,
				} );
			} else if ( previous.index === index ) {
				// Check if content changed (same position)
				if (
					JSON.stringify( previous.block ) !== JSON.stringify( block )
				) {
					operations.push( {
						type: 'update',
						index,
						block,
						previousBlock: previous.block,
						timestamp,
					} );
				}
			}
		} );

		// Update current state
		this.currentBlocks = editorBlocks.map( ( b ) => ( { ...b } ) );
		this.pendingOperations.push( ...operations );
		this.takeSnapshot();

		return operations;
	}

	/**
	 * Get operations that haven't been synced yet
	 */
	getPendingOperations(): BlockOperation[] {
		return [ ...this.pendingOperations ];
	}

	/**
	 * Clear pending operations after successful sync
	 */
	clearPendingOperations(): void {
		this.pendingOperations = [];
	}

	/**
	 * Mark specific operations as synced
	 * @param operations
	 */
	markOperationsSynced( operations: BlockOperation[] ): void {
		const syncedTimestamps = new Set(
			operations.map( ( op ) => op.timestamp )
		);
		this.pendingOperations = this.pendingOperations.filter(
			( op ) => ! syncedTimestamps.has( op.timestamp )
		);
	}

	getCurrentBlocks(): Block[] {
		return this.currentBlocks.map( ( b ) => ( { ...b } ) );
	}
}
