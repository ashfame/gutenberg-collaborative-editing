import { useDataManager } from './hooks/useDataManager';
import { PresenceUI } from './components/PresenceUI';
import { ReadOnlyUI } from './components/ReadOnlyUI';
import { useEffect } from '@wordpress/element';
import { lockEditor, releaseEditor } from './utils';

export const CollaborativeEditing = () => {
	const INACTIVITY_TIMEOUT = 240; // seconds

	const { collaborationMode, state, syncAwareness } = useDataManager();
	const { isLockHolder, awareness } = state;

	useEffect( () => {
		const activeUsers = Object.fromEntries(
			Object.entries( awareness ).filter( ( [ , userData ] ) => {
				const heartbeatAge = Math.floor( Date.now() / 1000 ) - userData.heartbeat_ts;
				return heartbeatAge < INACTIVITY_TIMEOUT;
			} )
		);

		if ( Object.keys( activeUsers ).length > 1 ) {
			document.body.classList.add( 'gutenberg-collaborative-editing' );
		} else {
			document.body.classList.remove( 'gutenberg-collaborative-editing' );
		}
	}, [ awareness ] );

	useEffect( () => {
		if ( collaborationMode === 'BLOCK-LEVEL-LOCKS' ) {
			/**
			 * Experimenting with not disabling autosaving in BLOCK-LEVEL-LOCKS
			 * but if we need to know, that's the only thing we are to do
			 */
			return;
		}

		const editorElement = document.querySelector< HTMLElement >(
			'.editor-visual-editor'
		);

		const release = () => {
			document.body.classList.remove(
				'gutenberg-collaborative-editing-readonly'
			);
			// editorElement might not be available on cleanup, so we need to query for it again.
			const editorElementOnCleanup = document.querySelector(
				'.editor-visual-editor'
			);
			if ( editorElementOnCleanup instanceof HTMLElement ) {
				releaseEditor( editorElementOnCleanup );
			}
			wp.data
				.dispatch( 'core/editor' )
				.unlockPostSaving( 'collaborative-editing' );
			wp.data
				.dispatch( 'core/editor' )
				.unlockPostAutosaving( 'collaborative-editing' );
		};

		if ( ! isLockHolder ) {
			document.body.classList.add(
				'gutenberg-collaborative-editing-readonly'
			);
			if ( editorElement ) {
				lockEditor( editorElement );
			}
			wp.data
				.dispatch( 'core/editor' )
				.lockPostSaving( 'collaborative-editing' );
			wp.data
				.dispatch( 'core/editor' )
				.lockPostAutosaving( 'collaborative-editing' );
		} else {
			release();
		}

		return release;
	}, [ isLockHolder, collaborationMode ] );

	return (
		<>
			<PresenceUI
				awarenessState={ awareness }
				syncAwareness={ syncAwareness }
			/>
			{ collaborationMode === 'READ-ONLY-FOLLOW' && (
				<ReadOnlyUI isReadOnly={ ! isLockHolder } />
			) }
		</>
	);
};
