import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { select, subscribe, useSelect } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';

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
	const [userLockData, setUserLockData] = useState({
		currentUserId: null,
		lockAcquireeUserId: null
	});
	const [currentUserHasLock, setCurrentUserHasLock] = useState(false);
	const [showROModal, setShowROModal] = useState(false);
	const [dataLoaded, setDataLoaded] = useState(false);
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current) return;
		
		initialized.current = true;
		whenEditorIsReady().then(() => {
			const editorSelect = select( 'core/editor' );
			const coreSelect = select( 'core' );

			const activePostLock = editorSelect?.getActivePostLock?.();
			console.log('DEBUG: activePostLock raw:', activePostLock);
			const lockAcquireeUserId = activePostLock ? parseInt( activePostLock.split(':').pop() ) : null;
			console.log('DEBUG: lockAcquireeUserId parsed:', lockAcquireeUserId);
			
			// Retry getting currentUserId until it's available
			const getCurrentUserWithRetry = () => {
				const currentUserId = coreSelect?.getCurrentUser?.()?.id;
				console.log('DEBUG: currentUserId attempt:', currentUserId);
				
				if (currentUserId !== undefined) {
					// We have the user ID, update state
					setUserLockData({
						currentUserId,
						lockAcquireeUserId
					});
					setDataLoaded(true);
				} else {
					// Retry after a short delay
					setTimeout(getCurrentUserWithRetry, 100);
				}
			};
			
			getCurrentUserWithRetry();
		});
	}, []);

	useEffect(() => {
		if (!dataLoaded) return; // Don't calculate until we have data
		
		const { currentUserId, lockAcquireeUserId } = userLockData;
		const currentUserHasLock = lockAcquireeUserId != null && currentUserId === lockAcquireeUserId;
		setCurrentUserHasLock( currentUserHasLock );
		setShowROModal( ! currentUserHasLock );
	}, [userLockData, dataLoaded]);

	useEffect(() => {
		const { currentUserId, lockAcquireeUserId } = userLockData;
		console.log('currentUserId:', currentUserId,'lockAcquireeUserId:', lockAcquireeUserId,'currentUserHasLock:', currentUserHasLock,'showROModal:', showROModal);
	}, [userLockData, currentUserHasLock, showROModal]);

	// Create notice when user doesn't have the lock
	useEffect(() => {
		if (!dataLoaded) return; // Don't create notice until we have data
		
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
	}, [currentUserHasLock, dataLoaded]);

	if (dataLoaded && showROModal) {
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
