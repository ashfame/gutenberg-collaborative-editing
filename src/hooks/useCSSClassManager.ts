import { useEffect } from '@wordpress/element';
import { AwarenessState, CollaborationMode } from "@/hooks/types";

export const useCSSClassManager = (
	collaborationMode: CollaborationMode,
	awareness: AwarenessState,
	isLockHolder: boolean
) => {
	useEffect( () => {
		const activeUsers = Object.fromEntries(
			Object.entries( awareness ).filter( ( [ , userData ] ) => {
				const heartbeatAge =
					Math.floor( Date.now() / 1000 ) - userData.heartbeat_ts;
				return heartbeatAge < window.gce.awarenessTimeout;
			} )
		);

		if ( Object.keys( activeUsers ).length > 1 ) {
			document.body.classList.add( 'gutenberg-collaborative-editing' );
		} else {
			document.body.classList.remove( 'gutenberg-collaborative-editing' );
		}

		return () => {
			document.body.classList.remove( 'gutenberg-collaborative-editing' );
		};
	}, [ awareness ] );

	useEffect(() => {
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
