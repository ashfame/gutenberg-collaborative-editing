import { useState, useCallback } from '@wordpress/element';

export function useCollaborationMode(): [ string, ( newMode: string ) => void ] {
	const [ collaborationMode, setCollaborationMode ] = useState<string>(
		() => window.gce?.collaborationMode
	);

	// Expose a way to update it
	const updateCollaborationMode = useCallback( ( newMode: string ) => {
		window.gce.collaborationMode = newMode;
		setCollaborationMode( newMode );
	}, [] );

	return [ collaborationMode, updateCollaborationMode ];
}
