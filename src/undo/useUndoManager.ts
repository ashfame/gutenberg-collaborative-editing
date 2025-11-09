import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { MutableRefObject } from 'react';
import { useDispatch } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { UndoManager } from './UndoManager';
import { UndoHistoryItem } from './types';

export const useUndoManager = (
	isUndoOrRedoInProgress: MutableRefObject< boolean >
) => {
	const undoManager = useMemo( () => new UndoManager(), [] );
	const [ canUndo, setCanUndo ] = useState( undoManager.canUndo() );
	const [ canRedo, setCanRedo ] = useState( undoManager.canRedo() );
	const { replaceBlock, insertBlocks, removeBlocks } =
		useDispatch( 'core/block-editor' );
	const [ blockEditor, setBlockEditor ] = useState< any >( null );
	useEffect( () => {
		const unsub = wp.data.subscribe( () => {
			setBlockEditor( wp.data.select( 'core/block-editor' ) );
		} );
		return unsub;
	}, [] );

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

	const undo = useCallback( async () => {
		isUndoOrRedoInProgress.current = true;
		const item = undoManager.undo();
		if ( ! item ) {
			isUndoOrRedoInProgress.current = false;
			return;
		}

		if ( ! blockEditor ) {
			isUndoOrRedoInProgress.current = false;
			return;
		}

		const { clientId, before, after } = item;

		if ( before && after ) {
			// It was an update, so we restore the 'before' state.
			// The `Block` type from block-sync is not compatible with what replaceBlocks expects.
			const parsedBlocks = parse( before.content );
			const blockIndex = blockEditor.getBlockIndex( clientId );
			await replaceBlock( clientId, parsedBlocks );
			const newBlocks = blockEditor.getBlocks();
			if ( newBlocks[ blockIndex ] ) {
				undoManager.updateClientId(
					clientId,
					newBlocks[ blockIndex ].clientId
				);
			}
		} else if ( ! before && after ) {
			// It was an insert, so we remove the block.
			removeBlocks( clientId );
		} else if ( before && ! after ) {
			// It was a delete, so we re-insert the block.
			const parsedBlocks = parse( before.content );
			insertBlocks( parsedBlocks, before.index );
		}

		updateState();
		isUndoOrRedoInProgress.current = false;
	}, [
		undoManager,
		updateState,
		replaceBlock,
		insertBlocks,
		removeBlocks,
		blockEditor,
		isUndoOrRedoInProgress,
	] );

	const redo = useCallback( async () => {
		isUndoOrRedoInProgress.current = true;
		const item = undoManager.redo();
		if ( ! item ) {
			isUndoOrRedoInProgress.current = false;
			return;
		}

		if ( ! blockEditor ) {
			isUndoOrRedoInProgress.current = false;
			return;
		}

		const { clientId, before, after } = item;

		if ( before && after ) {
			// It was an update, so we restore the 'after' state.
			const parsedBlocks = parse( after.content );
			const blockIndex = blockEditor.getBlockIndex( clientId );
			await replaceBlock( clientId, parsedBlocks );
			const newBlocks = blockEditor.getBlocks();
			if ( newBlocks[ blockIndex ] ) {
				undoManager.updateClientId(
					clientId,
					newBlocks[ blockIndex ].clientId
				);
			}
		} else if ( ! before && after ) {
			// It was an insert, so we re-insert the block.
			const parsedBlocks = parse( after.content );
			insertBlocks( parsedBlocks, after.index );
		} else if ( before && ! after ) {
			// It was a delete, so we remove the block again.
			removeBlocks( clientId );
		}
		updateState();
		isUndoOrRedoInProgress.current = false;
	}, [
		undoManager,
		updateState,
		replaceBlock,
		insertBlocks,
		removeBlocks,
		blockEditor,
		isUndoOrRedoInProgress,
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
