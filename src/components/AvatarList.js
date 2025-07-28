import UserAvatar from './UserAvatar';

const AvatarList = ( { users } ) => {
	const MAX_VISIBLE_AVATARS = 5;
	const INACTIVITY_TIMEOUT = 300; // seconds

	// Filter out stale presence based on INACTIVITY_TIMEOUT defined above
	const activeUsers = Object.fromEntries(
		Object.entries( users ).filter( ( [ _, userData]) => {
			const heartbeatAge = (Date.now() / 1000) - userData.heartbeat_ts;
			return heartbeatAge < INACTIVITY_TIMEOUT;
		})
	);

	// Filter out excessive users beyond the defined limit in MAX_VISIBLE_AVATARS
	const visibleUsers = Object.fromEntries(
		Object.entries(activeUsers).slice(0, MAX_VISIBLE_AVATARS)
	);
	const hiddenUsersCount = activeUsers.length - visibleUsers.length;

	return (
		<ul className="gce-avatar-list">
			{ Object.values( visibleUsers ).map( ( visibleUser, index ) => {
				return <UserAvatar key={ index } user={ visibleUser.user_data }
								   ringColor={ visibleUser.ring_color } />;
			} ) }
			{ hiddenUsersCount > 0 && (
				<div className="gce-avatar-list__more">
					+{ hiddenUsersCount }
				</div>
			) }
		</ul>
	);
};

export default AvatarList;
