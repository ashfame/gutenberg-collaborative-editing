import { useState, useMemo, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { UndoManager } from './UndoManager';
import { UndoHistoryItem } from './types';

export const useUndoManager = () => {
	const undoManager = useMemo( () => new UndoManager(), [] );
	const [ canUndo, setCanUndo ] = useState( undoManager.canUndo() );
	const [ canRedo, setCanRedo ] = useState( undoManager.canRedo() );
	const { replaceBlock, insertBlocks, removeBlocks } =
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
		console.log( 'custom undo fired' );
		const item = undoManager.undo();
		if ( ! item ) {
			console.log( 'no item' );
			return;
		}

		const { clientId, before, after } = item;

		if ( before && after ) {
			console.log( 'lets replace block', item );
			// It was an update, so we restore the 'before' state.
			// The `Block` type from block-sync is not compatible with what replaceBlocks expects.
			const parsedBlocks = parse( before.content );
			replaceBlock( clientId, parsedBlocks );
		} else if ( ! before && after ) {
			console.log( 'lets remove block' );
			// It was an insert, so we remove the block.
			removeBlocks( clientId );
		} else if ( before && ! after ) {
			console.log( 'lets insert block' );
			// It was a delete, so we re-insert the block.
			const parsedBlocks = parse( before.content );
			insertBlocks( parsedBlocks, before.index );
		}

		updateState();
	}, [
		undoManager,
		updateState,
		replaceBlock,
		insertBlocks,
		removeBlocks,
	] );

	const redo = useCallback( () => {
		console.log( 'custom redo fired' );
		const item = undoManager.redo();
		if ( ! item ) {
			return;
		}

		const { clientId, before, after } = item;

		if ( before && after ) {
			// It was an update, so we restore the 'after' state.
			const parsedBlocks = parse( after.content );
			replaceBlock( clientId, parsedBlocks );
		} else if ( ! before && after ) {
			// It was an insert, so we re-insert the block.
			const parsedBlocks = parse( after.content );
			insertBlocks( parsedBlocks, after.index );
		} else if ( before && ! after ) {
			// It was a delete, so we remove the block again.
			removeBlocks( clientId );
		}
		updateState();
	}, [
		undoManager,
		updateState,
		replaceBlock,
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
