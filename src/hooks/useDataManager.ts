import { useEffect, useReducer, useCallback } from '@wordpress/element';
import { useGutenbergState } from './useGutenbergState';
import { useTransportManager } from './useTransportManager';
import { useContentSyncer } from './useContentSyncer';
import { useDispatch } from '@wordpress/data';
import { parse, serialize } from '@wordpress/blocks';
import { useCollaborationMode } from './useCollaborationMode';
import { getCursorState, mergeBlocks } from '../utils';
import { CollaborativeState, CursorState } from './types';

const restoreSelection = ( state: CursorState, resetSelection: Function ) => {
	if ( ! state ) {
		return;
	}

	setTimeout( () => {
		const newBlockOrder = wp.data
			.select( 'core/block-editor' )
			.getBlockOrder();

		// Handles multi-block selection
		if (
			typeof state.blockIndexStart !== 'undefined' &&
			state.blockIndexStart !== -1 &&
			state.blockIndexEnd !== -1 &&
			state.blockIndexStart < newBlockOrder.length &&
			state.blockIndexEnd < newBlockOrder.length
		) {
			const newStartClientId =
				newBlockOrder[ state.blockIndexStart ];
			const newEndClientId =
				newBlockOrder[ state.blockIndexEnd ];
			resetSelection(
				{
					clientId: newStartClientId,
					offset: state.cursorPosStart,
				},
				{
					clientId: newEndClientId,
					offset: state.cursorPosEnd,
				}
			);
			return; // exit after handling
		}

		// Handles single-block selection (collapsed or ranged)
		if (
			typeof state.blockIndex !== 'undefined' &&
			state.blockIndex !== -1 &&
			state.blockIndex < newBlockOrder.length
		) {
			const newClientId = newBlockOrder[ state.blockIndex ];
			if (
				newClientId &&
				typeof state.cursorPosStart !== 'undefined'
			) {
				// Ranged selection in a single block
				resetSelection(
					{
						clientId: newClientId,
						offset: state.cursorPosStart,
					},
					{
						clientId: newClientId,
						offset: state.cursorPosEnd,
					}
				);
			} else if (
				newClientId &&
				typeof state.cursorPos !== 'undefined'
			) {
				// Collapsed cursor in a single block
				resetSelection(
					{
						clientId: newClientId,
						offset: state.cursorPos,
					},
					{
						clientId: newClientId,
						offset: state.cursorPos,
					}
				);
			}
		}
	}, 0 );
};

const handleDataReceived = ( data: any, dependencies: any ) => {
	if ( ! data ) {
		return;
	}

	const { awareness, content, modified } = data;
	const {
		editPost,
		resetBlocks,
		resetSelection,
		dispatch,
	} = dependencies;

	if ( modified && content ) {
		const receivedContent = content;
		const cursorState = getCursorState();

		if (
			receivedContent.content &&
			receivedContent.content.html
		) {
			resetBlocks( parse( receivedContent.content.html ) );
			editPost( {
				content: receivedContent.content.html,
				title: receivedContent.content.title || '',
			} );
			console.info( 'Content updated from collaborator 🌗' );
			restoreSelection( cursorState, resetSelection );
		} else if (
			receivedContent.content &&
			typeof receivedContent.content === 'string'
		) {
			const receivedBlocks = parse( receivedContent.content );
			const existingBlocks = wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const engagedBlockIndex = cursorState?.blockIndex;

			const blocksToSet = mergeBlocks(
				existingBlocks,
				receivedBlocks,
				engagedBlockIndex
			);

			resetBlocks( blocksToSet );
			editPost( {
				content: serialize( blocksToSet ),
			} );
			console.info( 'Content updated from collaborator 🌓' );
			restoreSelection( cursorState, resetSelection );
		}
	}

	if ( awareness ) {
		dispatch( { type: 'SET_AWARENESS', payload: { awareness } } );
	}
};

interface DataManagerState {
	isLockHolder: boolean;
	awareness: CollaborativeState[ 'awareness' ];
}

const initialState: DataManagerState = {
	isLockHolder: false,
	awareness: {},
};

type ReducerAction =
	| {
			type: 'SET_AWARENESS';
			payload: { awareness: CollaborativeState[ 'awareness' ] };
	  }
	| { type: 'LOCK_STATUS_UPDATED'; payload: { isLockHolder: boolean } };

function reducer( state: DataManagerState, action: ReducerAction ) {
	switch ( action.type ) {
		case 'SET_AWARENESS': {
			return {
				...state,
				awareness: action.payload.awareness,
			};
		}
		case 'LOCK_STATUS_UPDATED': {
			const { isLockHolder } = action.payload;
			return {
				...state,
				isLockHolder,
			};
		}
		default:
			return state;
	}
}

/**
 * The single source of truth for the collaborative editing session.
 */
export const useDataManager = ( transport = 'ajax-with-long-polling' ) => {
	const [ collaborationMode, ] = useCollaborationMode();

	// Get all required data in a single useSelect
	const {
		currentUserId,
		isLockHolder,
		editorContent,
		blockContent,
		cursorState
	} = useGutenbergState();

	const postId = window.gce.postId;

	const [ state, dispatch ] = useReducer( reducer, initialState );
	const { editPost } = useDispatch( 'core/editor' );
	const { resetBlocks, resetSelection } = useDispatch( 'core/block-editor' );

	const onDataReceived = useCallback(
		( data: any ) => {
			handleDataReceived( data, {
				editPost,
				resetBlocks,
				resetSelection,
				dispatch,
			} );
		},
		[ editPost, resetBlocks, resetSelection, dispatch ]
	);

	const { send } = useTransportManager( {
		transport,
		postId,
		onDataReceived,
	} );

	const syncAwareness = ( awareness: CursorState ) => {
		send( { type: 'awareness', payload: awareness } );
	};

	const syncContent = useCallback(
		( payload: { content: any; blockIndex?: number } ) => {
			if ( ! document.hasFocus() ) {
				return;
			}
			send( { type: 'content', payload } );
		},
		[ send ]
	);

	useContentSyncer( {
		collaborationMode,
		isLockHolder,
		postId,
		editorContent,
		blockContent,
		cursorState,
		onSync: syncContent,
	});

	useEffect( () => {
		if ( currentUserId === null || !postId ) {
			return;
		}
		dispatch( {
			type: 'LOCK_STATUS_UPDATED',
			payload: { isLockHolder },
		} );
	}, [ isLockHolder, currentUserId, postId ] );

	return {
		collaborationMode,
		state,
		syncAwareness
	};
};
