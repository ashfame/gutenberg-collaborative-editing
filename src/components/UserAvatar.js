import { Tooltip } from '@wordpress/components';

const UserAvatar = ( { user, ringColor } ) => {
	if ( ! user || ! user.name ) {
		return null;
	}

	return (
		<Tooltip text={ user.name } delay="100">
			<li
				className="gce-user-avatar"
				style={ { '--gce-ring-color': ringColor } }
			>
				<img
					src={ user.avatar }
					alt={ user.name }
					className="avatar"
				/>
			</li>
		</Tooltip>
	);
};

export default UserAvatar;
