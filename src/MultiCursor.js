export class MultiCursor {
	constructor(doc, overlayElement, currentUserId) {
		this.document = doc;
		this.overlay = overlayElement;
		this.currentUserId = currentUserId;
		this.users = new Map();
		this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#c56cf0', '#ff9f43', '#2e86de'];
		this.userColorMap = new Map();
	}

	updateUser(userId, cursorState) {
		if (parseInt(userId, 10) === this.currentUserId) {
			return;
		}
		try {
			this.users.set(userId, { cursor: cursorState });
		} catch (e) {
			console.error('Failed to parse cursor state for user', userId, cursorState, e);
		}
	}

	removeUser(userId) {
		this.users.delete(userId);
		this.userColorMap.delete(userId);
	}

	getPos(blockEl, charOffset) {
		const findTextPosition = (root, offset) => {
			const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
			let currentOffset = 0;
			let node;
			let lastTextNode = null;

			while ((node = walker.nextNode())) {
				const len = node.nodeValue.length;
				if (currentOffset + len >= offset) {
					return { node, offset: offset - currentOffset };
				}
				currentOffset += len;
				lastTextNode = node;
			}

			if (lastTextNode) {
				return { node: lastTextNode, offset: lastTextNode.nodeValue.length };
			}

			return { node: root, offset: 0 };
		};

		const pos = findTextPosition(blockEl, charOffset);

		if (!pos.node) {
			return null;
		}

		const range = this.document.createRange();
		try {
			range.setStart(pos.node, pos.offset);
		} catch (e) {
			console.error('Failed to set range start', e, pos);
			return null;
		}
		range.collapse(true);

		const rect = range.getBoundingClientRect();
		const overlayRect = this.overlay.getBoundingClientRect();
		const blockRect = blockEl.getBoundingClientRect();

		let x;
		let y;
		if (rect.x === 0 && rect.y === 0 && rect.width === 0 && rect.height === 0) {
			// This can happen for empty blocks.
			x = blockRect.left - overlayRect.left;
			y = blockRect.top - overlayRect.top;
		} else {
			x = rect.left - overlayRect.left;
			y = rect.top - overlayRect.top;
		}

		let height = rect.height;
		if (height === 0) {
			height = parseInt(window.getComputedStyle(blockEl).lineHeight, 10) || blockRect.height;
		}

		return {
			x,
			y,
			height,
		};
	}

	getCoordinatesForCursor(blockIndex, cursorPos) {
		console.log('getCoordinatesForCursor', blockIndex, cursorPos);
		const blocks = window.wp?.data?.select('core/block-editor').getBlockOrder();
		if (!blocks || blockIndex >= blocks.length) return null;

		const clientId = blocks[blockIndex];
		const blockEl = this.document.querySelector(`[data-block="${clientId}"] .rich-text`) ||
			this.document.querySelector(`[data-block="${clientId}"] .block-editor-rich-text__editable`) ||
			this.document.querySelector(`[data-block="${clientId}"]`);
		if (!blockEl) return null;

		const coords = this.getPos(blockEl, cursorPos);
		return coords ? { startCoords: coords, isSelection: false } : null;
	}

	getCoordinatesForSelection(blockIndexStart, cursorPosStart, blockIndexEnd, cursorPosEnd) {
		const blocks = window.wp?.data?.select('core/block-editor').getBlockOrder();
		if (!blocks || blockIndexStart >= blocks.length || blockIndexEnd >= blocks.length) return null;

		const startClientId = blocks[blockIndexStart];
		const endClientId = blocks[blockIndexEnd];

		const startBlockEl = this.document.querySelector(`[data-block="${startClientId}"] .rich-text`) ||
			this.document.querySelector(`[data-block="${startClientId}"] .block-editor-rich-text__editable`) ||
			this.document.querySelector(`[data-block="${startClientId}"]`);

		const endBlockEl = this.document.querySelector(`[data-block="${endClientId}"] .rich-text`) ||
			this.document.querySelector(`[data-block="${endClientId}"] .block-editor-rich-text__editable`) ||
			this.document.querySelector(`[data-block="${endClientId}"]`);

		if (!startBlockEl || !endBlockEl) return null;

		const startCoords = this.getPos(startBlockEl, cursorPosStart);
		const endCoords = this.getPos(endBlockEl, cursorPosEnd);

		if (startCoords && endCoords) {
			return { startCoords, endCoords, isSelection: true };
		}
		return null;
	}

	getCoordinatesFromCursorState(cursorState) {
		console.log('getCoordinatesFromCursorState', cursorState);
		const { blockIndex, cursorPos, blockIndexStart, blockIndexEnd, cursorPosStart, cursorPosEnd } = cursorState;

		if (blockIndexStart !== undefined) {
			return this.getCoordinatesForSelection(blockIndexStart, cursorPosStart, blockIndexEnd, cursorPosEnd);
		}

		if (blockIndex !== undefined) {
			const x = this.getCoordinatesForCursor(blockIndex, cursorPos);
			console.log('getCoordinatesFromCursorState', x);
			return x;
			// return this.getCoordinatesForCursor(blockIndex, cursorPos);
		}

		return null;
	}

	renderCursors(awarenessData) {
		console.log('renderCursors', awarenessData);
		if (!awarenessData) {
			return;
		}
		
		Object.keys(awarenessData).forEach(userId => {
			if (awarenessData[userId]?.cursor_state) {
				this.updateUser(userId, awarenessData[userId].cursor_state);
			} else {
				this.removeUser(userId);
			}
		});

		// Clean up overlay
		this.overlay.innerHTML = '';

		// Render each user's cursor
		this.users.forEach((user, userId) => {
			const result = this.getCoordinatesFromCursorState(user.cursor);
			if (!result) {
				return;
			}
			
			if (!this.userColorMap.has(userId)) {
				this.userColorMap.set(userId, this.colors[this.userColorMap.size % this.colors.length]);
			}
			const color = this.userColorMap.get(userId);

			if (result.isSelection) {
				// Render selection
				const selection = this.document.createElement('div');
				selection.className = 'remote-selection';
				const { startCoords, endCoords } = result;
				selection.style.left = `${startCoords.x}px`;
				selection.style.top = `${startCoords.y}px`;
				selection.style.width = `${endCoords.x - startCoords.x}px`;
				selection.style.height = `${startCoords.height}px`; // Assuming single line selection for now
				selection.style.backgroundColor = color;
				this.overlay.appendChild(selection);
			} else {
				// Create cursor element
				const cursor = this.document.createElement('div');
				cursor.className = 'remote-cursor';
				cursor.style.left = `${result.startCoords.x}px`;
				cursor.style.top = `${result.startCoords.y}px`;
				cursor.style.backgroundColor = color;
				if (result.startCoords.height) {
					cursor.style.height = `${result.startCoords.height}px`;
				}
				
				// Create label
				const label = this.document.createElement('div');
				label.className = 'cursor-label';
				label.textContent = `User ${userId}`; // In a real app, you'd fetch the user's name
				label.style.backgroundColor = color;
				
				cursor.appendChild(label);
				this.overlay.appendChild(cursor);
			}
		});
	}
} 