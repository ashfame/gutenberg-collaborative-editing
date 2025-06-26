import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const PostNotLocked = () => {
	return (
		<Modal
			className="gutenberg-collaborative-editing-post-locked-modal"
			title={ __( 'Post Not Locked', 'gutenberg-collaborative-editing' ) }
			onRequestClose={ () => {} }
		>
			<p>
				This post is not locked anymore.
			</p>
			<p>
				Soon, you will able to do more.
			</p>
			<Button variant="primary" onClick={ () => {} }>
				Okay
			</Button>
		</Modal>
	);
};
