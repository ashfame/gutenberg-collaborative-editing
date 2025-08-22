import { useEffect, useReducer, useCallback } from '@wordpress/element';
import { useGutenbergState } from './useGutenbergState';
import { useTransportManager } from './useTransportManager';
import { useContentSyncer } from './useContentSyncer';
import { useDispatch } from '@wordpress/data';
import { parse, serialize } from '@wordpress/blocks';
import { useCollaborationMode } from './useCollaborationMode';
import { getCursorState, mergeBlocks } from '../utils';

const initialState = {
	isLockHolder: false,
	awareness: {},
};

function reducer( state, action ) {
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

	const handleDataReceived = useCallback(
		( data ) => {
			if ( ! data ) {
				return;
			}

			const restoreSelection = ( state ) => {
				if ( ! state ) {
					return;
				}

				setTimeout( () => {
					const newBlockOrder = wp.data
						.select( 'core/block-editor' )
						.getBlockOrder();

					let newClientId, newStartClientId, newEndClientId;

					if ( state.anchorName && state.anchorAttributes ) {
						const newBlocks = wp.data.select( 'core/block-editor' ).getBlocks();
						const newAnchorBlock = newBlocks.find( b =>
							b.name === state.anchorName &&
							JSON.stringify( b.attributes ) === state.anchorAttributes
						);
						if ( newAnchorBlock ) {
							newClientId = newAnchorBlock.clientId;
						}
					}

					// Handles multi-block selection
					if (
						typeof state.blockIndexStart !== 'undefined' &&
						state.blockIndexStart !== -1 &&
						state.blockIndexEnd !== -1 &&
						state.blockIndexStart < newBlockOrder.length &&
						state.blockIndexEnd < newBlockOrder.length
					) {
						newStartClientId =
							newBlockOrder[ state.blockIndexStart ];
						newEndClientId =
							newBlockOrder[ state.blockIndexEnd ];
						console.log(
							'Restoring multi-block selection:',
							state
						);
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
						if ( ! newClientId ) {
							newClientId = newBlockOrder[ state.blockIndex ];
						}
						if ( newClientId && typeof state.cursorPosStart !== 'undefined' ) {
							// Ranged selection in a single block
							console.log(
								'Restoring ranged selection in a single block:',
								state
							);
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
						} else if ( newClientId && typeof state.cursorPos !== 'undefined' ) {
							// Collapsed cursor in a single block
							console.log(
								'Restoring collapsed cursor in a single block:',
								state
							);
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

			console.info( 'Data received from transport:', data );
			const { awareness, content, modified } = data;

			if ( modified && content ) {
				const receivedContent = content;
				const cursorState = getCursorState();

				if ( cursorState && typeof cursorState.blockIndex !== 'undefined' && cursorState.blockIndex !== -1 ) {
					const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
					const anchorBlock = blocks[ cursorState.blockIndex ];
					if ( anchorBlock ) {
						cursorState.anchorAttributes = JSON.stringify( anchorBlock.attributes );
						cursorState.anchorName = anchorBlock.name;
					}
				}

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
					restoreSelection( cursorState );
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
					restoreSelection( cursorState );
				}
			}

			if ( awareness ) {
				dispatch( { type: 'SET_AWARENESS', payload: { awareness } } );
			}
		},
		[ editPost, resetSelection, editorContent ]
	);

	const { send } = useTransportManager( {
		transport,
		postId,
		onDataReceived: handleDataReceived,
	} );

	const syncAwareness = ( awareness ) => {
		send( { type: 'awareness', payload: awareness } );
	};

	const syncContent = useCallback( ( payload ) => {
		if ( ! document.hasFocus() ) {
			return;
		}
		send( { type: 'content', payload } );
	}, [ send ] );

	useContentSyncer({
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
