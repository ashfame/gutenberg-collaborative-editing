import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { select, subscribe, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

function whenEditorIsReady() {
	return new Promise((resolve) => {
		const unsubscribe = subscribe(() => {
			// TODO: revisit this logic I grabbed off the web

			// This will trigger after the initial render blocking, before the window load event
			// This seems currently more reliable than using __unstableIsEditorReady
			if (select('core/editor').isCleanNewPost() || select('core/block-editor').getBlockCount() > 0) {
				unsubscribe()
				resolve()
			}
		})
	})
}

export const PostNotLocked = () => {
	const [currentUserId, setCurrentUserId] = useState(null);
	const [lockAcquireeUserId, setLockAcquireeUserId] = useState(null);
	const [currentUserHasLock, setCurrentUserHasLock] = useState(false);
	const [showROModal, setShowROModal] = useState(false);

	whenEditorIsReady().then(() => {
		const editorSelect = select( 'core/editor' );
		const coreSelect = select( 'core' );

		const activePostLock = editorSelect?.getActivePostLock?.();
		const lockAcquireeUserId = activePostLock ? parseInt( activePostLock.split(':').pop() ) : null;
		const currentUserId = coreSelect?.getCurrentUser?.()?.id;

		setCurrentUserId(currentUserId);
		setLockAcquireeUserId(lockAcquireeUserId);
	});

	useEffect(() => {
		const currentUserHasLock = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		setCurrentUserHasLock( currentUserHasLock );
		setShowROModal( ! currentUserHasLock );
	}, [currentUserId, lockAcquireeUserId]);

	useEffect(() => {
		console.log('currentUserId:', currentUserId,'lockAcquireeUserId:', lockAcquireeUserId,'currentUserHasLock:', currentUserHasLock,'showROModal:', showROModal);
	}, [currentUserId, lockAcquireeUserId, currentUserHasLock, showROModal]);

	// Create notice when user doesn't have the lock
	useEffect(() => {
		if (currentUserHasLock) {
			wp.data.dispatch('core/notices').removeNotice('read-only-mode');
			return;
		}
		wp.data.dispatch('core/notices').createNotice(
			'info',
			'Read-only mode',
			{
				isDismissible: false,
				id: 'read-only-mode'
			}
		);
	}, [currentUserHasLock]);

	if (showROModal) {
		return (
			<Modal
				className="gutenberg-collaborative-editing-post-locked-modal"
				title={__('READ_ONLY', 'gutenberg-collaborative-editing')}
				onRequestClose={() => setShowROModal(false)}
			>
				<p>
					You only have read-only access to this post right now.
				</p>
				<Button variant="primary" onClick={() => setShowROModal(false)}>
					Okay
				</Button>
			</Modal>
		);
	}
};
