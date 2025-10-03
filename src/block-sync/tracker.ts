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
	public isReceivingContent: boolean = false;

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

		const prevBlocks = Array.from( this.previousSnapshot.values() ).sort(
			( a, b ) => a.index - b.index
		);
		const prevBlockIds = prevBlocks.map( ( item ) => item.block.clientId );
		const editorBlockIds = editorBlocks.map( ( b ) => b.clientId );
		const lcsIds = new Set( this.findLCS( prevBlockIds, editorBlockIds ) );

		// Detect deletions and moves
		prevBlocks.forEach( ( { block, index } ) => {
			const { clientId } = block;
			if ( ! newBlocksMap.has( clientId ) ) {
				// Block was deleted
				operations.push( {
					type: 'delete',
					index,
					block,
					timestamp,
				} );
			} else if ( ! lcsIds.has( clientId ) ) {
				const newData = newBlocksMap.get( clientId )!;
				// Block was moved
				operations.push( {
					type: 'move',
					fromIndex: index,
					toIndex: newData.index,
					block: newData.block,
					timestamp,
				} );
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
			} else if ( lcsIds.has( clientId ) ) {
				// Check if content changed (only for non-moved blocks)
				if (
					JSON.stringify( previous.block.content ) !==
					JSON.stringify( block.content )
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

	private findLCS< T >( a: T[], b: T[] ): T[] {
		const m = a.length;
		const n = b.length;
		const dp = Array( m + 1 )
			.fill( 0 )
			.map( () => Array( n + 1 ).fill( 0 ) );

		for ( let i = 1; i <= m; i++ ) {
			for ( let j = 1; j <= n; j++ ) {
				if ( a[ i - 1 ] === b[ j - 1 ] ) {
					dp[ i ][ j ] = dp[ i - 1 ][ j - 1 ] + 1;
				} else {
					dp[ i ][ j ] = Math.max(
						dp[ i - 1 ][ j ],
						dp[ i ][ j - 1 ]
					);
				}
			}
		}

		// Backtrack to find the LCS
		const lcs: T[] = [];
		let i = m;
		let j = n;
		while ( i > 0 && j > 0 ) {
			if ( a[ i - 1 ] === b[ j - 1 ] ) {
				lcs.unshift( a[ i - 1 ] );
				i--;
				j--;
			} else if ( dp[ i - 1 ][ j ] > dp[ i ][ j - 1 ] ) {
				i--;
			} else {
				j--;
			}
		}
		return lcs;
	}

	/**
	 * Reset the tracker's state to a new set of blocks.
	 * @param newBlocks The new blocks to set as the current state.
	 */
	resetState( newBlocks: Block[] ): void {
		this.currentBlocks = newBlocks.map( ( b ) => ( { ...b } ) );
		this.pendingOperations = [];
		this.takeSnapshot();
	}
}
