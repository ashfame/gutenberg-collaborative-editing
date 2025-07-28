import { Tooltip } from '@wordpress/components';

const UserAvatar = ( { user } ) => {
	if ( ! user || ! user.name ) {
		return null;
	}

	const { name, avatar } = user;

	return (
		<Tooltip text={ name }>
			<li className="gce-user-avatar">
				<img
					src={ avatar }
					alt={ name }
					className="avatar"
				/>
			</li>
		</Tooltip>
	);
};

export default UserAvatar;
