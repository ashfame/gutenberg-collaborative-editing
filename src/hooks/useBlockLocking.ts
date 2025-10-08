import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { AwarenessState } from '@/hooks/types';

export const useBlockLocking = ( otherUsers: AwarenessState ) => {
	const { setLockedBlocks } = useDispatch( 'gce' );

	useEffect( () => {
		const lockedBlocks: string[] = [];
		Object.values( otherUsers ).forEach( ( user ) => {
			if ( ! user.cursor_state ) {
				// eslint-disable-next-line no-console
				console.log( '🚧 when is this happening?', user );
				return;
			}
			const blockIndex =
				'blockIndex' in user.cursor_state
					? user.cursor_state.blockIndex
					: user.cursor_state.blockIndexStart;

			const existingBlocks = wp.data
				.select( 'core/block-editor' )
				.getBlocks();

			const block = existingBlocks[ blockIndex ];
			if ( block ) {
				lockedBlocks.push( block.clientId );
			}
		} );
		setLockedBlocks( lockedBlocks );

		// Cleanup function to remove locks when users leave
		return () => {
			setLockedBlocks( [] );
		};
	}, [ otherUsers, setLockedBlocks ] );
};
