import { useEffect } from '@wordpress/element';
import { AwarenessState, CollaborationMode } from '@/hooks/types';

export const useCSSClassManager = (
	collaborationMode: CollaborationMode,
	activeUsers: AwarenessState,
	isLockHolder: boolean
) => {
	useEffect( () => {
		if ( Object.keys( activeUsers ).length > 1 ) {
			document.body.classList.add( 'gutenberg-collaborative-editing' );
		} else {
			document.body.classList.remove( 'gutenberg-collaborative-editing' );
		}

		return () => {
			document.body.classList.remove( 'gutenberg-collaborative-editing' );
		};
	}, [ activeUsers ] );

	useEffect( () => {
		if ( collaborationMode === 'BLOCK-LEVEL-LOCKS' ) {
			return;
		}

		if ( isLockHolder ) {
			document.body.classList.remove(
				'gutenberg-collaborative-editing-readonly'
			);
		} else {
			document.body.classList.add(
				'gutenberg-collaborative-editing-readonly'
			);
		}

		return () => {
			document.body.classList.remove(
				'gutenberg-collaborative-editing-readonly'
			);
		};
	}, [ isLockHolder, collaborationMode ] );
};
