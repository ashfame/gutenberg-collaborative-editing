import UserAvatar from './UserAvatar';

const AvatarList = ( { users } ) => {
	const MAX_VISIBLE_AVATARS = 5;
	const visibleUsers = users.slice( 0, MAX_VISIBLE_AVATARS );
	const hiddenUsersCount = users.length - visibleUsers.length;

	return (
		<div className="gce-avatar-list">
			{ visibleUsers.map( ( awarenessState, index ) => {
				return <UserAvatar key={ index } user={ awarenessState.user } />;
			} ) }
			{ hiddenUsersCount > 0 && (
				<div className="gce-avatar-list__more">
					+{ hiddenUsersCount }
				</div>
			) }
		</div>
	);
};

export default AvatarList; 