import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	lockedBlocks: [],
};

const store = createReduxStore( 'gce', {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'SET_LOCKED_BLOCKS':
				return {
					...state,
					lockedBlocks: action.lockedBlocks,
				};
		}
		return state;
	},
	actions: {
		setLockedBlocks( lockedBlocks: string[] ) {
			return {
				type: 'SET_LOCKED_BLOCKS',
				lockedBlocks,
			};
		},
	},
	selectors: {
		getLockedBlocks( state: { lockedBlocks: string[] } ) {
			return state.lockedBlocks;
		},
	},
} );

register( store );

export default store;
