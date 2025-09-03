import { useDataManager } from './hooks/useDataManager';
import { PresenceUI } from './components/PresenceUI';
import { ReadOnlyUI } from './components/ReadOnlyUI';
import { useEffect } from '@wordpress/element';
import { lockEditor, releaseEditor } from './utils';
import { useCSSClassManager } from "@/hooks/useCSSClassManager";
import { useGutenbergEditorControls } from "@/hooks/useGutenbergEditorControls";

export const CollaborativeEditing = () => {
	const { collaborationMode, state, syncAwareness } = useDataManager();
	const { isLockHolder, awareness } = state;

	useCSSClassManager( collaborationMode, awareness, isLockHolder );
	useGutenbergEditorControls( collaborationMode, isLockHolder );

	useEffect( () => {
		if ( collaborationMode === 'BLOCK-LEVEL-LOCKS' ) {
			return;
		}

		const release = () => {
			// editorElement might not be available on cleanup, so we need to query for it again.
			const editorElementOnCleanup = document.querySelector(
				'.editor-visual-editor'
			);
			if ( editorElementOnCleanup instanceof HTMLElement ) {
				releaseEditor( editorElementOnCleanup );
			}
		};

		if ( ! isLockHolder ) {
			const editorElement = document.querySelector< HTMLElement >(
				'.editor-visual-editor'
			);
			if ( editorElement ) {
				lockEditor( editorElement );
			}
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
