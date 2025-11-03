import { useState, useMemo, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { UndoManager } from './UndoManager';
import { UndoHistoryItem } from './types';

export const useUndoManager = () => {
	const undoManager = useMemo( () => new UndoManager(), [] );
	const [ canUndo, setCanUndo ] = useState( undoManager.canUndo() );
	const [ canRedo, setCanRedo ] = useState( undoManager.canRedo() );
	const { replaceBlocks, insertBlocks, removeBlocks } =
		useDispatch( 'core/block-editor' );

	const updateState = useCallback( () => {
		setCanUndo( undoManager.canUndo() );
		setCanRedo( undoManager.canRedo() );
	}, [ undoManager ] );

	const record = useCallback(
		( item: UndoHistoryItem ) => {
			undoManager.record( item );
			updateState();
		},
		[ undoManager, updateState ]
	);

	const undo = useCallback( () => {
		const item = undoManager.undo();
		if ( ! item ) {
			return;
		}

		const { clientId, before, after } = item;

		if ( before && after ) {
			// It was an update, so we restore the 'before' state.
			// The `Block` type from block-sync is compatible with what replaceBlocks expects.
			replaceBlocks( clientId, before );
		} else if ( ! before && after ) {
			// It was an insert, so we remove the block.
			removeBlocks( clientId );
		} else if ( before && ! after ) {
			// It was a delete, so we re-insert the block.
			insertBlocks( before, before.index );
		}

		updateState();
	}, [
		undoManager,
		updateState,
		replaceBlocks,
		insertBlocks,
		removeBlocks,
	] );

	const redo = useCallback( () => {
		const item = undoManager.redo();
		if ( ! item ) {
			return;
		}

		const { clientId, before, after } = item;

		if ( before && after ) {
			// It was an update, so we restore the 'after' state.
			replaceBlocks( clientId, after );
		} else if ( ! before && after ) {
			// It was an insert, so we re-insert the block.
			insertBlocks( after, after.index );
		} else if ( before && ! after ) {
			// It was a delete, so we remove the block again.
			removeBlocks( clientId );
		}
		updateState();
	}, [
		undoManager,
		updateState,
		replaceBlocks,
		insertBlocks,
		removeBlocks,
	] );

	const invalidate = useCallback(
		( clientId: string ) => {
			undoManager.invalidate( clientId );
			updateState();
		},
		[ undoManager, updateState ]
	);

	return {
		record,
		undo,
		redo,
		invalidate,
		canUndo,
		canRedo,
	};
};
