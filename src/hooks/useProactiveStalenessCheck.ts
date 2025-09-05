import { useEffect, useRef } from '@wordpress/element';
import { AwarenessState, UserAwareness } from './types';

/**
 * A hook that proactively checks for stale awareness states.
 *
 * It calculates when the next user's awareness is expected to go stale,
 * and sets a timeout to trigger a callback at that exact moment. This ensures
 * that the UI updates in real-time as users become inactive.
 *
 * @param awareness The current awareness state of all active users except the current user.
 * @param onStale   A callback function to execute when a staleness check is needed.
 */
export const useProactiveStalenessCheck = (
	awareness: AwarenessState,
	onStale: () => void
) => {
	const awarenessTimeoutRef = useRef< number | null >( null );

	useEffect( () => {
		// Clear any existing timeout on re-render.
		if ( awarenessTimeoutRef.current ) {
			clearTimeout( awarenessTimeoutRef.current );
		}

		const users = Object.values( awareness );
		if ( users.length === 0 ) {
			// Nothing to schedule if there are no users.
			return;
		}

		// Find the timestamp of the user whose awareness will get stale first.
		const nearestHeartbeatTs = Math.min(
			...Object.values( users ).map( ( user: UserAwareness ) => {
				return user.heartbeat_ts;
			} )
		);

		const expirationTs =
			nearestHeartbeatTs + parseInt( window.gce.awarenessTimeout, 10 );
		const expirationTsInMs = expirationTs * 1000;
		const checkAgainIn = expirationTsInMs - Date.now();

		if ( checkAgainIn > 0 ) {
			// We have a future expiration, schedule the check.
			awarenessTimeoutRef.current = window.setTimeout( () => {
				onStale();
			}, checkAgainIn );
		} else {
			// The next timeout is in the past, so we should report for staleness immediately.
			onStale();
		}

		// Cleanup function to clear the timeout if the component unmounts.
		return () => {
			if ( awarenessTimeoutRef.current ) {
				clearTimeout( awarenessTimeoutRef.current );
			}
		};
	}, [ awareness, onStale ] );
};
