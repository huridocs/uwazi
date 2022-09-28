/* eslint-disable jest/no-focused-tests */
/* eslint-disable max-statements */
/* eslint-disable jest/no-focused-tests */
/* eslint-disable max-statements */
// import util from 'util';
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { MatchQueryNode } from '../MatchQueryNode';
import { NonChainQueryError } from '../NonChainQueryErrror';
import { TraversalQueryNode } from '../TraversalQueryNode';

describe('when calling chainsDecomposition()', () => {
  // eslint-disable-next-line max-statements
  it('should return an array of the queries from the chain decomposition of the query', () => {
    /* eslint-disable */
    const query = new MatchQueryNode({ sharedId: 'root' }, [ // Root
      new TraversalQueryNode('out', {}, [ // R -> A
        new MatchQueryNode({}, [ // A
          new TraversalQueryNode('out', {}, [ // A -> B
            new MatchQueryNode({}, []), //B
          ]),
          new TraversalQueryNode('out', {}, [ // A -> D
            new MatchQueryNode({}, []), // D
          ]),
        ]),
      ]),
      new TraversalQueryNode('out', {}, [ // R -> C
        new MatchQueryNode({}, []) // C
      ]),
    ]);
    

    const chain1 = new MatchQueryNode({ sharedId: 'root' }, [ // Root
      new TraversalQueryNode('out', {}, [ // R -> A
        new MatchQueryNode({}, [ // A
          new TraversalQueryNode('out', {}, [ // A -> B
            new MatchQueryNode({}, []) // B
          ]),
        ]),
      ]),
    ]);

    const chain2 = new MatchQueryNode({ sharedId: 'root' }, [ // Root
      new TraversalQueryNode('out', {}, [ // R -> A
        new MatchQueryNode({}, [ // A
          new TraversalQueryNode('out', {}, [ // A -> D
            new MatchQueryNode({}, []) // D
          ]),
        ]),
      ]),
    ]);

    const chain3 = new MatchQueryNode({ sharedId: 'root' }, [ // Root
      new TraversalQueryNode('out', {}, [ // R -> C
        new MatchQueryNode({}, []), // C
      ]),
    ]);


    /* eslint-enable */
    expect(query.chainsDecomposition()).toEqual([chain1, chain2, chain3]);
  });
});

// eslint-disable-next-line max-statements
describe('when calling inverse()', () => {
  const chain0 = new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, []);
  const inverted0 = new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, []);

  const chain1 = new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, [
    new TraversalQueryNode('out', {}, [new MatchQueryNode({}, [])]),
  ]);
  const inverted1 = new MatchQueryNode({}, [
    new TraversalQueryNode('in', {}, [
      new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, []),
    ]),
  ]);

  const chain2 = new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, [
    new TraversalQueryNode('out', { types: ['type1'] }, [
      new MatchQueryNode({}, [
        new TraversalQueryNode('in', { types: ['type2'] }, [
          new MatchQueryNode({ sharedId: 'leaf1', templates: ['temp2'] }, []),
        ]),
      ]),
    ]),
  ]);
  const inverted2 = new MatchQueryNode({ sharedId: 'leaf1', templates: ['temp2'] }, [
    new TraversalQueryNode('out', { types: ['type2'] }, [
      new MatchQueryNode({}, [
        new TraversalQueryNode('in', { types: ['type1'] }, [
          new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, []),
        ]),
      ]),
    ]),
  ]);

  it.each([
    { chain: chain0, inverted: inverted0 },
    { chain: chain1, inverted: inverted1 },
    { chain: chain2, inverted: inverted2 },
  ])('should return an inverted query', ({ chain, inverted }) => {
    expect(chain.inverse()).toEqual(inverted);
  });
});

// eslint-disable-next-line jest/no-focused-tests
describe('when calling reachesRelationship()', () => {
  it('should return false if no segment <match, traverse, match> of the query would match the given relationship', () => {
    const query = new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['temp2'] }, [
          new TraversalQueryNode('in', { types: ['type2'] }, [
            new MatchQueryNode({ templates: ['temp3'] }, []),
          ]),
        ]),
      ]),
    ]);

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity1', 'entity2', 'type1'), {
        entity1: { template: 'temp1', sharedId: 'entity1' },
        entity2: { template: 'temp2', sharedId: 'entity2' },
      })
    ).toBe(false);

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity2', 'root', 'type1'), {
        root: { template: 'temp1', sharedId: 'root' },
        entity2: { template: 'temp1', sharedId: 'entity2' },
      })
    ).toBe(false);

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity1', 'entity2', 'type1'), {
        entity1: { template: 'temp2', sharedId: 'entity1' },
        entity2: { template: 'temp3', sharedId: 'entity2' },
      })
    ).toBe(false);

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity2', 'root', 'type1'), {
        root: { template: 'temp1', sharedId: 'root' },
        entity2: { template: 'temp2', sharedId: 'entity2' },
      })
    ).toBe(false);
  });

  it('should return the narrowed query that would match the given relationship', () => {
    const query = new MatchQueryNode({ templates: ['temp1'] }, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['temp2'] }, [
          new TraversalQueryNode('in', { types: ['type2'] }, [
            new MatchQueryNode({ templates: ['temp3'] }, [
              new TraversalQueryNode('out', { types: ['type3'] }, [
                new MatchQueryNode({ templates: ['temp4'] }, []),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity1', 'entity2', 'type1'), {
        entity1: { template: 'temp1', sharedId: 'entity1' },
        entity2: { template: 'temp2', sharedId: 'entity2' },
      })
    ).toEqual(
      new MatchQueryNode({ templates: ['temp1'], sharedId: 'entity1' }, [
        new TraversalQueryNode('out', { types: ['type1'], _id: 'rel1' }, [
          new MatchQueryNode({ templates: ['temp2'], sharedId: 'entity2' }, []),
        ]),
      ])
    );

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity2', 'entity1', 'type2'), {
        entity1: { template: 'temp2', sharedId: 'entity1' },
        entity2: { template: 'temp3', sharedId: 'entity2' },
      })
    ).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ templates: ['temp2'], sharedId: 'entity1' }, [
            new TraversalQueryNode('in', { types: ['type2'], _id: 'rel1' }, [
              new MatchQueryNode({ templates: ['temp3'], sharedId: 'entity2' }, []),
            ]),
          ]),
        ]),
      ])
    );

    expect(
      query.reachesRelationship(new Relationship('rel1', 'entity1', 'entity2', 'type3'), {
        entity1: { template: 'temp3', sharedId: 'entity1' },
        entity2: { template: 'temp4', sharedId: 'entity2' },
      })
    ).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ templates: ['temp2'] }, [
            new TraversalQueryNode('in', { types: ['type2'] }, [
              new MatchQueryNode({ templates: ['temp3'], sharedId: 'entity1' }, [
                new TraversalQueryNode('out', { types: ['type3'], _id: 'rel1' }, [
                  new MatchQueryNode({ templates: ['temp4'], sharedId: 'entity2' }, []),
                ]),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  });
});

describe('when calling a method that only supports chain queries', () => {
  const query0 = new MatchQueryNode({ sharedId: 'root' }, [
    new TraversalQueryNode('out', {}, [new MatchQueryNode({}, [])]),
    new TraversalQueryNode('out', {}, [new MatchQueryNode({}, [])]),
  ]);

  const query1 = new MatchQueryNode({ sharedId: 'root' }, [
    new TraversalQueryNode('out', {}, [new MatchQueryNode({}, []), new MatchQueryNode({}, [])]),
  ]);

  const query2 = new MatchQueryNode({ sharedId: 'root' }, [
    new TraversalQueryNode('out', {}, [
      new MatchQueryNode({}, [
        new TraversalQueryNode('out', {}, [new MatchQueryNode({}, [])]),
        new TraversalQueryNode('out', {}, [new MatchQueryNode({}, [])]),
      ]),
    ]),
  ]);

  it.each([query0, query1, query2])(
    'should throw an error if the query %# is not a chain',
    query => {
      expect(() => {
        query.inverse();
      }).toThrow(NonChainQueryError);
      expect(() => {
        query.reachesRelationship(new Relationship('fakeRel', 'entity1', 'entity2', 'fakeType'), {
          entity1: { sharedId: 'entity1', template: 'fakeTemplate' },
          entity2: { sharedId: 'entity2', template: 'fakeTemplate' },
        });
      }).toThrow(NonChainQueryError);
    }
  );
});
