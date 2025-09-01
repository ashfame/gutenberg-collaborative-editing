import { useState, useEffect } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ReadOnlyBadge } from './ReadOnlyBadge';

interface ReadOnlyUIProps {
	isReadOnly: boolean;
}

export const ReadOnlyUI = ( { isReadOnly }: ReadOnlyUIProps ) => {
	const [ showModal, setShowModal ] = useState( isReadOnly );

	useEffect( () => {
		setShowModal( isReadOnly );
	}, [ isReadOnly ] );

	return (
		<>
			{ isReadOnly && <ReadOnlyBadge /> }
			{ showModal && (
				<Modal
					className="gutenberg-collaborative-editing-read-only-modal"
					title={ __(
						'Read-Only Mode',
						'gutenberg-collaborative-editing'
					) }
					onRequestClose={ () => setShowModal( false ) }
				>
					<p>
						{ __(
							'Someone else is currently editing this post. You can only view the post content.',
							'gutenberg-collaborative-editing'
						) }
					</p>
					<Button
						variant="primary"
						onClick={ () => setShowModal( false ) }
					>
						{ __( 'Okay', 'gutenberg-collaborative-editing' ) }
					</Button>
				</Modal>
			) }
		</>
	);
};
