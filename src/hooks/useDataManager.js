import { useEffect, useReducer, useCallback } from '@wordpress/element';
import { useGutenbergState } from './useGutenbergState';
import { useTransportManager } from './useTransportManager';
import { useContentSyncer } from './useContentSyncer';
import { useDispatch } from '@wordpress/data';

const initialState = {
	isReadOnly: false,
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
			const { isReadOnly } = action.payload;
			return {
				...state,
				isReadOnly,
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
	// Get all required data in a single useSelect
	const {
		currentUserId,
		isReadOnly,
		postId,
		editorContent,
	} = useGutenbergState();

	const [ state, dispatch ] = useReducer( reducer, initialState );
	const { editPost } = useDispatch( 'core/editor' );

	const handleDataReceived = useCallback(
		( data ) => {
			if ( ! data ) {
				return;
			}

			const { awareness, content, modified } = data;

			if ( modified && content ) {
				const receivedContent = content;

				if (
					receivedContent.content &&
					receivedContent.content.html
				) {
					editPost( {
						content: receivedContent.content.html,
						title: receivedContent.content.title || '',
					} );

					console.info( 'Content updated from collaborator' );
				}
			}

			if ( awareness ) {
				dispatch( { type: 'SET_AWARENESS', payload: { awareness } } );
			}
		},
		[ editPost ]
	);

	const { send } = useTransportManager( {
		transport,
		postId,
		onDataReceived: handleDataReceived,
	} );

	const syncAwareness = ( awareness ) => {
		console.info( 'syncAwareness()' );
		if ( ! document.hasFocus() ) {
			console.log('syncAwareness() skipped');
			return;
		}
		send( { type: 'awareness', payload: awareness } );
	};

	const syncContent = useCallback( ( content ) => {
		console.info( 'syncContent()' );
		if ( ! document.hasFocus() ) {
			console.log('syncContent() skipped');
			return;
		}
		send( { type: 'content', payload: content } );
	}, [ send ] );

	useContentSyncer({
		isReadOnly,
		postId,
		editorContent,
		onSync: syncContent,
	});

	useEffect( () => {
		if ( currentUserId === null || !postId ) {
			return;
		}
		dispatch( {
			type: 'LOCK_STATUS_UPDATED',
			payload: { isReadOnly },
		} );
	}, [ isReadOnly, currentUserId, postId ] );

	return {
		state,
		syncAwareness
	};
};
