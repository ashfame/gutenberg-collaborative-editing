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
	const engagedBlockB = createBlock( 'b', 'Engaged BBBB' );

	describe( 'when a block is moved', () => {
		// A block is moved up or down
		describe( 'swapping two blocks', () => {
			const received = [ blockA, blockC, blockB ]; // B and C swapped

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );
			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should handle moved block with fresh clientIds and preserve engaged content', () => {
				const engagedIndex = 1; // B engaged
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
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'new-a',
					'new-c',
					'b',
					'new-d',
				] );

				// Also ensure content of all blocks are as expected
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );
		} );

		describe( 'from start to end', () => {
			const received = [ blockB, blockC, blockA ];

			it( 'should work when a moved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock(
					'a',
					'Engaged Block A'
				);
				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
					'a',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe(
					'Engaged Block A'
				);
			} );

			it( 'should work when a moved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
					'a',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block A' );
			} );
		} );

		describe( 'from end to start', () => {
			const received = [ blockC, blockA, blockB ];

			it( 'should work when a moved block is engaged (modified)', () => {
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'c',
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe(
					'Engaged Block C'
				);
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when a moved block is engaged (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'c',
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
			} );
		} );
	} );

	describe( 'when a block is deleted', () => {
		describe( 'from the middle', () => {
			const received = [ blockA, blockC ]; // B deleted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'from the beginning', () => {
			const received = [ blockB, blockC ]; // A deleted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block C' );
			} );
			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [
					blockA,
					blockB,
					createBlock( 'c', 'Block CCCC' ),
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block CCCC' );
			} );

			it( 'should re-insert a deleted engaged block (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ]; // A is engaged
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a deleted engaged block (modified)', () => {
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock(
					'a',
					'Engaged Block A'
				);
				const existing = [ localEngagedBlockA, blockB, blockC ]; // A is engaged
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe(
					'Engaged Block A'
				);
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'from the end', () => {
			const received = [ blockA, blockB ]; // C deleted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
			} );

			it( 'should re-insert a deleted engaged block (modified)', () => {
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe(
					'Engaged Block C'
				);
			} );

			it( 'should re-insert a deleted engaged block (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
	} );

	// UPDATE of a block is essentially a REPLACE since client IDs differ
	describe( 'when a block is replaced', () => {
		describe( 'in the middle', () => {
			const received = [ blockA, blockD, blockC ]; // B replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Engaged AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
		describe( 'at the beginning', () => {
			const received = [ blockD, blockB, blockC ]; // A replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (modified)', () => {
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock( 'a', 'Engaged AAAA' );
				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should re-insert a replaced engaged block (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
		describe( 'at the end', () => {
			const received = [ blockA, blockB, blockD ]; // C replaced with D

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when an uninvolved block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when an uninvolved block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'd',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should re-insert a replaced engaged block (modified)', () => {
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock(
					'c',
					'Engaged Block C'
				);
				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe(
					'Engaged Block C'
				);
			} );
			it( 'should re-insert a replaced engaged block (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
			} );
		} );
	} );

	describe( 'when a block is inserted', () => {
		describe( 'in the middle', () => {
			const received = [ blockA, blockD, blockB, blockC ]; // D inserted

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1; // no engaged block
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
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

			it( 'should work when a block `before` the insertion point is engaged (unmodified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
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

			it( 'should work when a block `before` the insertion point is engaged (modified)', () => {
				const engagedIndex = 0; // Engage A
				const existing = [
					createBlock( 'a', 'Block AAAA' ),
					blockB,
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block AAAA' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `at` insertion point is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
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

			it( 'should work when a block `at` insertion point is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` the insertion point is engaged (unmodified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
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

			it( 'should work when a block `after` the insertion point is engaged (modified)', () => {
				const engagedIndex = 2; // Engage C
				const existing = [
					blockA,
					blockB,
					createBlock( 'c', 'Block CCCC' ),
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'd',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block CCCC' );
			} );
		} );

		describe( 'at the beginning', () => {
			const received = [ blockD, blockA, blockB, blockC ]; // D inserted at the start

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );
			} );

			it( 'should work when first block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when first block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` insertion point is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );

			it( 'should work when a block `after` insertion point is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'd',
					'a',
					'b',
					'c',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block D' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 2 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block C' );
			} );
		} );

		describe( 'at the end', () => {
			const received = [ blockA, blockB, blockC, blockD ]; // D inserted at the end

			it( 'should work when no block is engaged', () => {
				const engagedIndex = -1;
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
			} );

			it( 'should work when last block is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when last block is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when a block `before` insertion point is engaged (unmodified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [ blockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );
				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Block B' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );

			it( 'should work when a block `before` insertion point is engaged (modified)', () => {
				const engagedIndex = 1; // Engage B
				const existing = [
					blockA,
					createBlock( 'b', 'Engaged BBBB' ),
					blockC,
				];
				const result = mergeBlocks( existing, received, engagedIndex );
				expect( result.map( ( b ) => b.clientId ) ).toEqual( [
					'a',
					'b',
					'c',
					'd',
				] );

				expect( result[ 0 ].attributes.content ).toBe( 'Block A' );
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
				expect( result[ 2 ].attributes.content ).toBe( 'Block C' );
				expect( result[ 3 ].attributes.content ).toBe( 'Block D' );
			} );
		} );
	} );

	// Doesn't usually happen, but if it ever did, we test for the behavior
	describe( 'when an engaged block somehow comes in modified', () => {
		describe( 'in the middle', () => {
			it( 'should prioritize local modifications in engaged block', () => {
				const received = [ blockA, createBlock( 'b', 'bbbb' ), blockC ];
				const engagedIndex = 1; // Engage B

				const existing = [ blockA, engagedBlockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );

				// The engaged block from received should be in the result.
				expect( result[ 1 ].attributes.content ).toBe( 'Engaged BBBB' );
			} );
		} );

		describe( 'at the beginning', () => {
			it( 'should prioritize local modifications in engaged block', () => {
				const received = [ createBlock( 'a', 'aaaa' ), blockB, blockC ];
				const engagedIndex = 0; // Engage A
				const localEngagedBlockA = createBlock( 'a', 'Engaged AAAA' );

				const existing = [ localEngagedBlockA, blockB, blockC ];
				const result = mergeBlocks( existing, received, engagedIndex );

				expect( result[ 0 ].attributes.content ).toBe( 'Engaged AAAA' );
			} );
		} );

		describe( 'at the end', () => {
			it( 'should prioritize local modifications in engaged block', () => {
				const received = [ blockA, blockB, createBlock( 'c', 'cccc' ) ];
				const engagedIndex = 2; // Engage C
				const localEngagedBlockC = createBlock( 'c', 'Engaged CCCC' );

				const existing = [ blockA, blockB, localEngagedBlockC ];
				const result = mergeBlocks( existing, received, engagedIndex );

				expect( result[ 2 ].attributes.content ).toBe( 'Engaged CCCC' );
			} );
		} );
	} );

	it( 'should preserve engaged block (unmodified) even if all blocks are deleted', () => {
		const engagedIndex = 1; // Engage B

		const existing = [ blockA, blockB, blockC ];
		const result = mergeBlocks( existing, [], engagedIndex );

		expect( result.map( ( b ) => b.clientId ) ).toEqual( [ 'b' ] );
	} );

	it( 'should preserve engaged block (modified) even if all blocks are deleted', () => {
		const engagedIndex = 1; // Engage B

		const existing = [ blockA, engagedBlockB, blockC ];
		const result = mergeBlocks( existing, [], engagedIndex );

		expect( result.map( ( b ) => b.clientId ) ).toEqual( [ 'b' ] );
	} );
} );
