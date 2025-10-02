import { mergeBlocks } from './utils';

// Helper to create a mock block
const createBlock = ( id: string, content: string ) => ( {
	clientId: id,
	name: 'core/paragraph',
	isValid: true,
	attributes: { content },
	innerBlocks: [],
	originalContent: `<p>${ content }</p>`,
} );

describe( 'mergeBlocks', () => {
	const blockA = createBlock( 'a', 'Block A' );
	const blockB = createBlock( 'b', 'Block B' );
	const blockC = createBlock( 'c', 'Block C' );
	const blockD = createBlock( 'd', 'Block D' );

	// We assume the engaged block has some modified content
	const engagedBlockB = createBlock( 'b', 'Engaged Block B' );

	describe( 'when a block is moved', () => {
		describe( 'swapping two blocks', () => {
			const received = [ blockA, blockC, blockB ]; // B and C swapped

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when an uninvolved block is engaged', () => {
				const engagedBlockIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should handle moved block with fresh clientIds and preserve engaged content', () => {
				const engagedBlockIndex = 1; // B engaged
				const existing = [
					createBlock( 'a', 'Block A' ),
					createBlock( 'b', 'Block B' ),
					createBlock( 'c', 'Block C' ),
					createBlock( 'd', 'Block D' ),
				];
				// eslint-disable-next-line @typescript-eslint/no-shadow
				const received = [
					createBlock( 'new-a', 'Block A' ),
					createBlock( 'new-c', 'Block C' ),
					createBlock( 'new-b', 'Block B' ),
					createBlock( 'new-d', 'Block D' ),
				]; // B and C swapped
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'new-a',
					'new-c',
					'b',
					'new-d',
				] );

				// Also ensure content of all blocks are as expected
				const mergedBlockA = result.find(
					( b ) => b.clientId === 'new-a'
				);
				const mergedBlockB = result.find( ( b ) => b.clientId === 'b' );
				const mergedBlockC = result.find(
					( b ) => b.clientId === 'new-c'
				);
				const mergedBlockD = result.find(
					( b ) => b.clientId === 'new-d'
				);
				expect( mergedBlockA?.attributes.content ).toBe( 'Block A' );
				expect( mergedBlockB?.attributes.content ).toBe( 'Block B' );
				expect( mergedBlockC?.attributes.content ).toBe( 'Block C' );
				expect( mergedBlockD?.attributes.content ).toBe( 'Block D' );
			} );
		} );

		describe( 'from start to end', () => {
			const received = [ blockB, blockC, blockA ];

			it( 'should work when a moved block is engaged', () => {
				const engagedBlockIndex = 0; // Engage A
				const localEngagedBlockA = createBlock(
					'a',
					'Engaged Block A'
				);
				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
					'a',
				] );
			} );
		} );

		describe( 'from end to start', () => {
			const received = [ blockC, blockA, blockB ];

			it( 'should work when a moved block is engaged', () => {
				const engagedBlockIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'c',
					'a',
					'b',
				] );
			} );
		} );
	} );

	describe( 'when a block is deleted', () => {
		describe( 'from the middle', () => {
			const received = [ blockA, blockC ]; // B deleted

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged', () => {
				const engagedBlockIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block', () => {
				const engagedBlockIndex = 1; // Engage B
				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				const mergedEngagedBlock = result.find(
					( b ) => b.clientId === 'b'
				);
				expect( mergedEngagedBlock?.attributes.content ).toBe(
					'Engaged Block B'
				);
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'from the beginning', () => {
			const received = [ blockB, blockC ]; // A deleted

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
			} );

			it( 'should work when an uninvolved block is engaged', () => {
				const engagedBlockIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
			} );

			it( 'should re-insert a deleted engaged block', () => {
				const engagedBlockIndex = 0; // Engage A
				const localEngagedBlockA = createBlock(
					'a',
					'Engaged Block A'
				);
				const existing = [ localEngagedBlockA, blockB, blockC ]; // A is engaged
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
			} );
		} );

		describe( 'from the end', () => {
			const received = [ blockA, blockB ]; // C deleted

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
			} );

			it( 'should work when an uninvolved block is engaged', () => {
				const engagedBlockIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
			} );

			it( 'should re-insert a deleted engaged block', () => {
				const engagedBlockIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
			} );
		} );
	} );

	describe( 'when a block is replaced', () => {
		describe( 'in the middle', () => {
			const received = [ blockA, blockD, blockC ]; // B replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged', () => {
				const engagedBlockIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block', () => {
				const engagedBlockIndex = 1; // Engage B
				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				const mergedEngagedBlock = result.find(
					( b ) => b.clientId === 'b'
				);
				expect( mergedEngagedBlock?.attributes.content ).toBe(
					'Engaged Block B'
				);
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
		describe( 'at the beginning', () => {
			const received = [ blockD, blockB, blockC ]; // A replaced with D

			it( 'should re-insert a replaced engaged block', () => {
				const engagedBlockIndex = 0; // Engage A
				const localEngagedBlockA = createBlock(
					'a',
					'Engaged Block A'
				);
				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
			} );
		} );
		describe( 'at the end', () => {
			const received = [ blockA, blockB, blockD ]; // C replaced with D

			it( 'should re-insert a replaced engaged block', () => {
				const engagedBlockIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
			} );
		} );
	} );

	describe( 'when a block is inserted', () => {
		describe( 'in the middle', () => {
			const received = [ blockA, blockD, blockB, blockC ]; // D inserted

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block before the insertion is engaged', () => {
				const engagedBlockIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block after the insertion is engaged', () => {
				const engagedBlockIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged Block B' ),
					blockC,
				];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				const mergedEngagedBlock = result.find(
					( b ) => b.clientId === 'b'
				);
				expect( mergedEngagedBlock?.attributes.content ).toBe(
					'Engaged Block B'
				);
			} );
		} );

		describe( 'at the beginning', () => {
			const received = [ blockD, blockA, blockB, blockC ]; // D inserted at the start

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );
			} );

			it( 'should work when a block is engaged', () => {
				const engagedBlockIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged Block B' ),
					blockC,
				];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );
				const mergedEngagedBlock = result.find(
					( b ) => b.clientId === 'b'
				);
				expect( mergedEngagedBlock?.attributes.content ).toBe(
					'Engaged Block B'
				);
			} );
		} );

		describe( 'at the end', () => {
			const received = [ blockA, blockB, blockC, blockD ]; // D inserted at the end

			it( 'should work when no block is engaged', () => {
				const engagedBlockIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
			} );

			it( 'should work when a block is engaged', () => {
				const engagedBlockIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged Block B' ),
					blockC,
				];
				const result = mergeBlocks(
					existing,
					received,
					engagedBlockIndex
				);
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
				const mergedEngagedBlock = result.find(
					( b ) => b.clientId === 'b'
				);
				expect( mergedEngagedBlock?.attributes.content ).toBe(
					'Engaged Block B'
				);
			} );
		} );
	} );
} );
