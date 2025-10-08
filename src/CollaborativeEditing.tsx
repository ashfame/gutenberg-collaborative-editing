import { useDataManager } from './hooks/useDataManager';
import { PresenceUI } from './components/PresenceUI';
import { ReadOnlyUI } from './components/ReadOnlyUI';
import { useEffect } from '@wordpress/element';
import { lockEditor, releaseEditor } from './utils';
import { useCSSClassManager } from '@/hooks/useCSSClassManager';
import { useGutenbergEditorControls } from '@/hooks/useGutenbergEditorControls';
import { useBlockLocking } from './hooks/useBlockLocking';

export const CollaborativeEditing = () => {
	const { currentUserId, collaborationMode, state, syncAwareness } =
		useDataManager();
	const { isLockHolder, activeUsers, otherActiveUsers } = state;

	useCSSClassManager( collaborationMode, activeUsers, isLockHolder );
	useGutenbergEditorControls( collaborationMode, isLockHolder );
	useBlockLocking( otherActiveUsers );

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
				awarenessState={ otherActiveUsers }
				syncAwareness={ syncAwareness }
				currentUserId={ currentUserId }
			/>
			{ collaborationMode === 'READ-ONLY-FOLLOW' && (
				<ReadOnlyUI isReadOnly={ ! isLockHolder } />
			) }
		</>
	);
};
