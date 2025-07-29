import { useDataManager } from './hooks/useDataManager';
import { PresenceUI } from './components/PresenceUI';
import { ReadOnlyUI } from './components/ReadOnlyUI';
import { useEffect } from "@wordpress/element";
import { lockEditor, releaseEditor } from "./utils";

export const CollaborativeEditing = () => {
	const { state, syncAwareness } = useDataManager();

	useEffect( () => {
		const editorElement = document.querySelector( '.editor-visual-editor' );

		const release = () => {
			document.body.classList.remove( 'gutenberg-collaborative-editing-readonly' );
			// editorElement might not be available on cleanup, so we need to query for it again.
			const editorElementOnCleanup = document.querySelector( '.editor-visual-editor' );
			if ( editorElementOnCleanup ) {
				releaseEditor( editorElementOnCleanup );
			}
			wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'collaborative-editing' );
			wp.data.dispatch( 'core/editor' ).unlockPostAutosaving( 'collaborative-editing' );
		};

		if ( state.isReadOnly ) {
			document.body.classList.add( 'gutenberg-collaborative-editing-readonly' );
			lockEditor( editorElement );
			wp.data.dispatch( 'core/editor' ).lockPostSaving( 'collaborative-editing' );
			wp.data.dispatch( 'core/editor' ).lockPostAutosaving( 'collaborative-editing' );
		} else {
			release();
		}

		return release;
	}, [ state.isReadOnly ] );

	return (
		<>
			<PresenceUI
				awarenessState={ state.awareness }
				syncAwareness={ syncAwareness }
			/>
			<ReadOnlyUI isReadOnly={ state.isReadOnly } />
		</>
	);
};
