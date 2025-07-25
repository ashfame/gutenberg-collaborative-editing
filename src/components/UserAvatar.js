const UserAvatar = ( { user } ) => {
	if ( ! user || ! user.name ) {
		return null;
	}

	const { name, avatar } = user;

	return (
		<li className="gce-user-avatar">
			<img
				src={ avatar }
				alt={ name }
				className="avatar"
				title={ name }
			/>
		</li>
	);
};

export default UserAvatar;
