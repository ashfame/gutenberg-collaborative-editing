export class MultiCursor {
	constructor(doc, overlayElement, currentUserId) {
		this.document = doc;
		this.overlay = overlayElement;
		this.currentUserId = currentUserId;
		this.users = new Map();
		this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#c56cf0', '#ff9f43', '#2e86de'];
		this.userColorMap = new Map();
	}

	findTextPosition(root, offset) {
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
		const pos = this.findTextPosition(blockEl, charOffset);

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
		console.log('getCoordinatesForSelection: start', { blockIndexStart, cursorPosStart, blockIndexEnd, cursorPosEnd });
		if (
			blockIndexStart > blockIndexEnd ||
			(blockIndexStart === blockIndexEnd && cursorPosStart > cursorPosEnd)
		) {
			[blockIndexStart, blockIndexEnd] = [blockIndexEnd, blockIndexStart];
			[cursorPosStart, cursorPosEnd] = [cursorPosEnd, cursorPosStart];
		}

		const blocks = window.wp?.data?.select('core/block-editor').getBlockOrder();
		if (!blocks || blockIndexStart >= blocks.length || blockIndexEnd >= blocks.length) return null;

		const startClientId = blocks[blockIndexStart];
		const endClientId = blocks[blockIndexEnd];

		const getBlockEl = (clientId) =>
			this.document.querySelector(`[data-block="${clientId}"] .rich-text`) ||
			this.document.querySelector(`[data-block="${clientId}"] .block-editor-rich-text__editable`) ||
			this.document.querySelector(`[data-block="${clientId}"]`);

		const startBlockEl = getBlockEl(startClientId);
		const endBlockEl = getBlockEl(endClientId);

		console.log('getCoordinatesForSelection: blocks', { startBlockEl, endBlockEl });
		if (!startBlockEl || !endBlockEl) {
			console.log('getCoordinatesForSelection: returning null, block not found');
			return null;
		}

		const overlayRect = this.overlay.getBoundingClientRect();
		const rects = [];

		const addRects = (range) => {
			console.log('getCoordinatesForSelection: addRects range', range);
			const clientRects = range.getClientRects();
			console.log('getCoordinatesForSelection: addRects clientRects', clientRects);
			for (const rect of clientRects) {
				rects.push({
					x: rect.left - overlayRect.left,
					y: rect.top - overlayRect.top,
					width: rect.width,
					height: rect.height,
				});
			}
			console.log('getCoordinatesForSelection: addRects rects', rects);
		};

		if (blockIndexStart === blockIndexEnd) {
			console.log('getCoordinatesForSelection: single block selection');
			const range = this.document.createRange();
			const startPos = this.findTextPosition(startBlockEl, cursorPosStart);
			const endPos = this.findTextPosition(endBlockEl, cursorPosEnd);
			console.log('getCoordinatesForSelection: positions', { startPos, endPos });
			if (startPos.node && endPos.node) {
				try {
					range.setStart(startPos.node, startPos.offset);
					range.setEnd(endPos.node, endPos.offset);
					console.log('getCoordinatesForSelection: range created', range);
					addRects(range);
				} catch (e) {
					console.error('Failed to create range', e, startPos, endPos);
				}
			}
		} else {
			// Multi-block selection
			// 1. Rects for the start block
			const startRange = this.document.createRange();
			const startPos = this.findTextPosition(startBlockEl, cursorPosStart);
			const endOfStartBlock = this.findTextPosition(startBlockEl, startBlockEl.textContent.length);
			startRange.setStart(startPos.node, startPos.offset);
			startRange.setEnd(endOfStartBlock.node, endOfStartBlock.offset);
			addRects(startRange);

			// 2. Rects for intermediate blocks
			for (let i = blockIndexStart + 1; i < blockIndexEnd; i++) {
				const intermediateBlockEl = getBlockEl(blocks[i]);
				if (intermediateBlockEl) {
					const intermediateRange = this.document.createRange();
					intermediateRange.selectNodeContents(intermediateBlockEl);
					addRects(intermediateRange);
				}
			}

			// 3. Rects for the end block
			const endRange = this.document.createRange();
			const startOfEndBlock = this.findTextPosition(endBlockEl, 0);
			const endPos = this.findTextPosition(endBlockEl, cursorPosEnd);
			endRange.setStart(startOfEndBlock.node, startOfEndBlock.offset);
			endRange.setEnd(endPos.node, endPos.offset);
			addRects(endRange);
		}

		console.log('getCoordinatesForSelection: final rects', rects);
		const result = rects.length > 0 ? { rects, isSelection: true } : null;
		console.log('getCoordinatesForSelection: result', result);
		return result;
	}

	getCoordinatesFromCursorState(cursorState) {
		const { blockIndex, cursorPos, blockIndexStart, blockIndexEnd, cursorPosStart, cursorPosEnd } = cursorState;

		// This handles both single-block and multi-block selections.
		if (cursorPosStart !== undefined) {
			const startBlock = blockIndexStart !== undefined ? blockIndexStart : blockIndex;
			const endBlock = blockIndexEnd !== undefined ? blockIndexEnd : blockIndex;
			return this.getCoordinatesForSelection(startBlock, cursorPosStart, endBlock, cursorPosEnd);
		}

		// This handles a simple cursor (no selection).
		if (cursorPos !== undefined) {
			return this.getCoordinatesForCursor(blockIndex, cursorPos);
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
				const { rects } = result;
				rects.forEach(rect => {
					const selection = this.document.createElement('div');
					selection.className = 'remote-selection';
					selection.style.left = `${rect.x}px`;
					selection.style.top = `${rect.y}px`;
					selection.style.width = `${rect.width}px`;
					selection.style.height = `${rect.height}px`;
					selection.style.backgroundColor = color;
					this.overlay.appendChild(selection);
				});

				const cursor = this.document.createElement('div');
				cursor.className = 'remote-cursor';
				const lastRect = rects[rects.length - 1];
				cursor.style.left = `${lastRect.x + lastRect.width}px`;
				cursor.style.top = `${lastRect.y}px`;
				cursor.style.backgroundColor = color;
				if (lastRect.height) {
					cursor.style.height = `${lastRect.height}px`;
				}
				const label = this.document.createElement('div');
				label.className = 'cursor-label';
				label.textContent = `User ${userId}`; // In a real app, you'd fetch the user's name
				label.style.backgroundColor = color;

				cursor.appendChild(label);
				this.overlay.appendChild(cursor);
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