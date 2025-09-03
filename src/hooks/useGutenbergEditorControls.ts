import { useEffect } from '@wordpress/element';
import { CollaborationMode } from "@/hooks/types";

export const useGutenbergEditorControls = (
	collaborationMode: CollaborationMode,
	isLockHolder: boolean
) => {
	if ( collaborationMode === 'BLOCK-LEVEL-LOCKS' ) {
		return;
	}

	useEffect( () => {
		const {
			lockPostAutosaving,
			unlockPostAutosaving,
			lockPostSaving,
			unlockPostSaving,
		} = wp.data.dispatch( 'core/editor' );

		if ( isLockHolder ) {
			unlockPostAutosaving( 'gutenberg-collaborative-editing' );
			unlockPostSaving( 'gutenberg-collaborative-editing' );
		} else {
			lockPostAutosaving( 'gutenberg-collaborative-editing' );
			lockPostSaving( 'gutenberg-collaborative-editing' );
		}

		return () => {
			unlockPostAutosaving( 'gutenberg-collaborative-editing' );
			unlockPostSaving( 'gutenberg-collaborative-editing' );
		};
	}, [ isLockHolder ] );
};
