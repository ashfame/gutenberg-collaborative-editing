import { useState, useCallback } from "@wordpress/element";

export function useCollaborationMode() {
	const [ collaborationMode, setCollaborationMode ] = useState(
		() => window.gce?.collaborationMode
	);

	// Expose a way to update it
	const updateCollaborationMode = useCallback( ( newMode ) => {
		window.gce.collaborationMode = newMode;
		setCollaborationMode( newMode );
	}, [] );

	return [ collaborationMode, updateCollaborationMode ];
}
