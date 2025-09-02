import {
	Block,
	BlockOperation,
	TrackedBlock,
} from './types';

/**
 * Handles merging remote changes with local state
 * Implements conflict resolution strategies
 */
export class BlockSynchronizer {
  private localBlocks: TrackedBlock[] = [];
  private conflictStrategy: 'local-wins' | 'remote-wins' | 'merge' = 'merge';
  
  constructor(initialBlocks: Block[] = [], strategy?: 'local-wins' | 'remote-wins' | 'merge') {
    this.localBlocks = initialBlocks.map(b => ({ ...b }));
    if (strategy) this.conflictStrategy = strategy;
  }

  /**
   * Mark blocks that have local modifications
   */
  markLocalChanges(operations: BlockOperation[]): void {
    operations.forEach(op => {
      switch (op.type) {
        case 'insert': {
          // Find the block and mark it as locally added
          const insertedBlock = this.localBlocks.find(b => b.clientId === op.block.clientId);
          if (insertedBlock) {
            insertedBlock.locallyAdded = true;
            insertedBlock.lastModified = op.timestamp;
          }
          break;
        }
          
        case 'update': {
          const updatedBlock = this.localBlocks.find(b => b.clientId === op.block.clientId);
          if (updatedBlock) {
            updatedBlock.locallyModified = true;
            updatedBlock.lastModified = op.timestamp;
            if (!updatedBlock.lastSyncedVersion) {
              updatedBlock.lastSyncedVersion = op.previousBlock;
            }
          }
          break;
        }
          
        case 'delete': {
          // Mark for deletion but don't remove yet
          const deletedBlock = this.localBlocks.find(b => b.clientId === op.block.clientId);
          if (deletedBlock) {
            deletedBlock.pendingDelete = true;
            deletedBlock.lastModified = op.timestamp;
          }
          break;
        }
      }
    });
  }

  /**
   * Apply remote operations while preserving local changes
   */
  applyRemoteOperations(remoteOps: BlockOperation[]): {
    merged: Block[];
    conflicts: Array<{ local: Block; remote: Block; resolution: Block }>;
  } {
    const conflicts: Array<{ local: Block; remote: Block; resolution: Block }> = [];
    const remoteTimestamp = Date.now();

    // Sort operations by timestamp to apply in order
    const sortedOps = [...remoteOps].sort((a, b) => a.timestamp - b.timestamp);

    sortedOps.forEach(op => {
      switch (op.type) {
        case 'insert': {
          // Check if we have a local version of this block
          const existingLocal = this.localBlocks.find(b => b.clientId === op.block.clientId);
          
          if (!existingLocal) {
            // No conflict, insert the remote block
            this.localBlocks.splice(op.index, 0, {
              ...op.block,
              lastSyncedVersion: op.block,
              lastModified: remoteTimestamp
            });
          } else if (existingLocal.locallyAdded) {
            // Conflict: both sides added the same block
            const resolution = this.resolveConflict(existingLocal, op.block);
            conflicts.push({ local: existingLocal, remote: op.block, resolution });
            Object.assign(existingLocal, resolution);
          }
          break;
        }

        case 'update': {
          const localBlock = this.localBlocks.find(b => b.clientId === op.block.clientId);
          
          if (localBlock) {
            if (localBlock.locallyModified && !localBlock.pendingDelete) {
              // Conflict: both sides modified
              const resolution = this.resolveConflict(localBlock, op.block);
              conflicts.push({ local: { ...localBlock }, remote: op.block, resolution });
              
              if (this.conflictStrategy === 'remote-wins') {
                Object.assign(localBlock, op.block);
                localBlock.locallyModified = false;
              } else if (this.conflictStrategy === 'merge') {
                Object.assign(localBlock, resolution);
                // Keep locallyModified flag to sync back merged version
              }
              // For 'local-wins', don't apply remote changes
            } else if (!localBlock.pendingDelete) {
              // No conflict, apply remote update
              Object.assign(localBlock, op.block);
              localBlock.lastSyncedVersion = op.block;
              localBlock.lastModified = remoteTimestamp;
            }
          }
          break;
        }

        case 'delete': {
          const blockToDelete = this.localBlocks.findIndex(b => b.clientId === op.block.clientId);
          
          if (blockToDelete !== -1) {
            const block = this.localBlocks[blockToDelete];
            
            if (block.locallyModified && !block.pendingDelete) {
              // Conflict: remote deleted but we modified
              if (this.conflictStrategy === 'remote-wins') {
                this.localBlocks.splice(blockToDelete, 1);
              }
              // For 'local-wins' or 'merge', keep the local version
              conflicts.push({ 
                local: block, 
                remote: { ...op.block, pendingDelete: true } as Block,
                resolution: this.conflictStrategy === 'remote-wins' 
                  ? { ...op.block, pendingDelete: true } as Block 
                  : block 
              });
            } else {
              // No conflict, delete the block
              this.localBlocks.splice(blockToDelete, 1);
            }
          }
          break;
        }

        case 'move': {
          const blockIndex = this.localBlocks.findIndex(b => b.clientId === op.block.clientId);
          if (blockIndex !== -1 && blockIndex !== op.toIndex) {
            const [block] = this.localBlocks.splice(blockIndex, 1);
            this.localBlocks.splice(op.toIndex, 0, block);
          }
          break;
        }
      }
    });

    // Clean up pending deletes that were confirmed by remote
    this.localBlocks = this.localBlocks.filter(b => !b.pendingDelete);

    // Return merged state without tracking flags for editor
    const merged = this.localBlocks.map(b => {
      const { locallyModified, locallyAdded, pendingDelete, lastSyncedVersion, lastModified, ...cleanBlock } = b;
      return cleanBlock;
    });

    return { merged, conflicts };
  }

  /**
   * Resolve conflicts between local and remote versions
   */
  private resolveConflict(local: Block, remote: Block): Block {
    switch (this.conflictStrategy) {
      case 'local-wins':
        return { ...local };
      
      case 'remote-wins':
        return { ...remote };
      
      case 'merge':
        // Simple merge: combine properties, preferring local for conflicts
        // In a real implementation, this would be more sophisticated
        return {
          ...remote,
          ...local,
          clientId: local.clientId,
          metadata: {
            ...remote.metadata,
            ...local.metadata,
            merged: true,
            mergedAt: Date.now()
          }
        };
    }
  }

  /**
   * Get blocks that need to be synced to remote
   */
  getLocalChangesToSync(): BlockOperation[] {
    const operations: BlockOperation[] = [];
    const timestamp = Date.now();

    this.localBlocks.forEach((block, index) => {
      if (block.locallyAdded) {
        operations.push({
          type: 'insert',
          index,
          block,
          timestamp
        });
      } else if (block.locallyModified) {
        operations.push({
          type: 'update',
          index,
          block,
          previousBlock: block.lastSyncedVersion || block,
          timestamp
        });
      } else if (block.pendingDelete) {
        operations.push({
          type: 'delete',
          index,
          block,
          timestamp
        });
      }
    });

    return operations;
  }

  /**
   * Mark local changes as synced after successful sync
   */
  markAsSynced(): void {
    this.localBlocks.forEach(block => {
      if (block.locallyAdded) {
        block.locallyAdded = false;
      }
      if (block.locallyModified) {
        block.locallyModified = false;
        block.lastSyncedVersion = { ...block };
      }
    });
    
    // Remove blocks marked for deletion
    this.localBlocks = this.localBlocks.filter(b => !b.pendingDelete);
  }

  getCurrentBlocks(): Block[] {
    return this.localBlocks
      .filter(b => !b.pendingDelete)
      .map(b => {
        const { locallyModified, locallyAdded, pendingDelete, lastSyncedVersion, lastModified, ...cleanBlock } = b;
        return cleanBlock;
      });
  }
}
