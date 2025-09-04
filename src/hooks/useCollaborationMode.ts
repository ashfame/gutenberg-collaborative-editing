import { useState, useCallback } from '@wordpress/element';
import { CollaborationMode } from '@/hooks/types';

export function useCollaborationMode(): [
	CollaborationMode,
	( newMode: CollaborationMode ) => void,
] {
	const [ collaborationMode, setCollaborationMode ] =
		useState< CollaborationMode >( () => window.gce?.collaborationMode );

	// Expose a way to update it
	const updateCollaborationMode = useCallback(
		( newMode: CollaborationMode ) => {
			window.gce.collaborationMode = newMode;
			setCollaborationMode( newMode );
		},
		[]
	);

	return [ collaborationMode, updateCollaborationMode ];
}
