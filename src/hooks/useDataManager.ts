import {
	useEffect,
	useReducer,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import { useGutenbergState } from './useGutenbergState';
import {
	useTransportManager,
	UseTransportManagerConfig,
} from './useTransportManager';
import { useContentSyncer } from './useContentSyncer';
import { useDispatch } from '@wordpress/data';
import { parse, serialize } from '@wordpress/blocks';
import { useCollaborationMode } from './useCollaborationMode';
import { getCursorState, mergeBlocks } from '@/utils';
import { CursorState, AwarenessState } from './types';
import { TransportReceivedData } from '@/transports/types';
import { useProactiveStalenessCheck } from './useProactiveStalenessCheck';
import { BlockChangeTracker, Block } from '../block-sync';

const restoreSelection = (
	state: CursorState | null,
	resetSelection: Function
) => {
	if ( ! state ) {
		return;
	}

	setTimeout( () => {
		const newBlockOrder = wp.data
			.select( 'core/block-editor' )
			.getBlockOrder();

		// Handles multi-block selection
		if (
			'blockIndexStart' in state &&
			state.blockIndexStart !== -1 &&
			'blockIndexEnd' in state &&
			state.blockIndexEnd !== -1 &&
			state.blockIndexStart < newBlockOrder.length &&
			state.blockIndexEnd < newBlockOrder.length
		) {
			const newStartClientId = newBlockOrder[ state.blockIndexStart ];
			const newEndClientId = newBlockOrder[ state.blockIndexEnd ];
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
			'blockIndex' in state &&
			state.blockIndex !== -1 &&
			state.blockIndex < newBlockOrder.length
		) {
			const newClientId = newBlockOrder[ state.blockIndex ];
			if ( newClientId && 'cursorPosStart' in state ) {
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
			} else if ( newClientId && 'cursorPos' in state ) {
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

const handleDataReceived = (
	data: TransportReceivedData,
	dependencies: any
) => {
	if ( ! data ) {
		return;
	}

	const { awareness, content, modified } = data;
	const { editPost, resetBlocks, resetSelection, dispatch } = dependencies;

	if ( modified && content && content.content ) {
		const receivedContent = content.content;
		const cursorState = getCursorState();

		if ( ! receivedContent || ! ( 'html' in receivedContent ) ) {
			return;
		}

		if ( window.gce.collaborationMode === 'READ-ONLY-FOLLOW' ) {
			resetBlocks( parse( receivedContent.html ) );
			editPost( {
				content: receivedContent.html,
				title: receivedContent.title || '',
			} );

			// eslint-disable-next-line no-console
			console.info( 'Content updated from collaborator 🌗' );
			restoreSelection( cursorState, resetSelection );
		} else if ( window.gce.collaborationMode === 'BLOCK-LEVEL-LOCKS' ) {
			const receivedBlocks = parse( receivedContent.html );
			const existingBlocks = wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const engagedBlockIndex =
				cursorState && 'blockIndex' in cursorState
					? cursorState.blockIndex
					: undefined;

			const blocksToSet = mergeBlocks(
				existingBlocks,
				receivedBlocks,
				engagedBlockIndex ?? -1
			);

			resetBlocks( blocksToSet );
			editPost( {
				content: serialize( blocksToSet ),
				title: receivedContent.title || '',
			} );

			// eslint-disable-next-line no-console
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
	awareness: AwarenessState;
	activeUsers: AwarenessState;
	otherUsers: AwarenessState;
	otherActiveUsers: AwarenessState;
}

const initialState: DataManagerState = {
	isLockHolder: false,
	awareness: {},
	activeUsers: {},
	otherUsers: {},
	otherActiveUsers: {},
};

type ReducerAction =
	| {
			type: 'SET_AWARENESS';
			payload: { awareness: AwarenessState };
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
 * @param transport
 */
export const useDataManager = ( transport = 'ajax-with-long-polling' ) => {
	const [ collaborationMode ] = useCollaborationMode();

	// Get all required data in a single useSelect
	const {
		currentUserId,
		isLockHolder,
		editorContent,
		blockContent,
		cursorState,
		blocks,
	} = useGutenbergState();

	const postId = window.gce.postId;
	const tracker = useRef( new BlockChangeTracker() );

	useEffect( () => {
		if ( ! blocks ) {
			return;
		}

		// The tracker expects a simplified `Block` object.
		const mappedBlocks: Block[] = blocks.map( ( block ) => ( {
			clientId: block.clientId,
			content: block.attributes,
		} ) );

		const operations = tracker.current.updateFromEditor( mappedBlocks );
		if ( operations.length > 0 ) {
			// eslint-disable-next-line no-console
			console.log( 'Pending operations:', operations );
		}
	}, [ blocks ] );

	const [ state, dispatch ] = useReducer( reducer, initialState );
	const { editPost } = useDispatch( 'core/editor' );
	const { resetBlocks, resetSelection } = useDispatch( 'core/block-editor' );
	const [ recalcTrigger, forceRecalculate ] = useReducer( ( x ) => x + 1, 0 );

	const onDataReceived = useCallback(
		( data: TransportReceivedData ) => {
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
	} as UseTransportManagerConfig< TransportReceivedData > );

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
		blockContent: blockContent || '',
		cursorState,
		onSync: syncContent,
	} );

	const { awareness } = state;
	const derivedState = useMemo( () => {
		// Build using reduce to preserve number keys and the AwarenessState type
		const activeUsers = Object.keys( awareness ).reduce< AwarenessState >(
			( acc, key ) => {
				const userId = Number( key );
				const userData = awareness[ userId ];
				const heartbeatAge =
					Math.floor( Date.now() / 1000 ) - userData.heartbeat_ts;
				if ( heartbeatAge < window.gce.awarenessTimeout ) {
					acc[ userId ] = userData;
				}
				return acc;
			},
			{}
		);

		const otherUsers: AwarenessState = { ...awareness };
		if ( typeof currentUserId === 'number' ) {
			delete otherUsers[ currentUserId ];
		}

		const otherActiveUsers: AwarenessState = { ...activeUsers };
		if ( typeof currentUserId === 'number' ) {
			delete otherActiveUsers[ currentUserId ];
		}

		return {
			awareness,
			activeUsers,
			otherUsers,
			otherActiveUsers,
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ awareness, currentUserId, recalcTrigger ] );

	// Proactively check for stale users and trigger a state recalculation.
	useProactiveStalenessCheck(
		derivedState.otherActiveUsers,
		forceRecalculate
	);

	useEffect( () => {
		if ( currentUserId === null || ! postId ) {
			return;
		}
		dispatch( {
			type: 'LOCK_STATUS_UPDATED',
			payload: { isLockHolder },
		} );
	}, [ isLockHolder, currentUserId, postId ] );

	return {
		collaborationMode,
		state: { ...state, ...derivedState },
		syncAwareness,
	};
};
