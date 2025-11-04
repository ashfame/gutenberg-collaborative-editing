import { UndoHistoryItem } from './types';

export class UndoManager {
	private undoStack: UndoHistoryItem[] = [];
	private redoStack: UndoHistoryItem[] = [];

	public record( item: UndoHistoryItem ) {
		this.undoStack.push( item );
		// A new action clears the redo stack.
		this.redoStack = [];
	}

	public undo() {
		const item = this.undoStack.pop();
		if ( item ) {
			this.redoStack.push( item );
		}
		return item;
	}

	public redo() {
		const item = this.redoStack.pop();
		if ( item ) {
			this.undoStack.push( item );
		}
		return item;
	}

	public invalidate( clientId: string ) {
		// eslint-disable-next-line no-console
		console.log( 'invalidate block from stack', clientId );
		this.undoStack = this.undoStack.filter(
			( item ) => item.clientId !== clientId
		);
		this.redoStack = this.redoStack.filter(
			( item ) => item.clientId !== clientId
		);
	}

	public canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	public canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	public clear() {
		this.undoStack = [];
		this.redoStack = [];
	}
}
