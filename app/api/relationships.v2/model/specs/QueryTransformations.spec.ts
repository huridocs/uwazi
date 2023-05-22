import { EntityPointer, Relationship } from 'api/relationships.v2/model/Relationship';
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

describe('when calling reachesRelationship()', () => {
  it('should return undefined if no segment <match, traverse, match> of the query would match the given relationship', () => {
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
      query.reachesRelationship(
        new Relationship(
          'rel1',
          new EntityPointer('entity1'),
          new EntityPointer('entity2'),
          'type1'
        ),
        {
          entity1: { template: 'temp1', sharedId: 'entity1' },
          entity2: { template: 'temp2', sharedId: 'entity2' },
        }
      )
    ).toBe(undefined);

    expect(
      query.reachesRelationship(
        new Relationship('rel1', new EntityPointer('entity2'), new EntityPointer('root'), 'type1'),
        {
          root: { template: 'temp1', sharedId: 'root' },
          entity2: { template: 'temp1', sharedId: 'entity2' },
        }
      )
    ).toBe(undefined);

    expect(
      query.reachesRelationship(
        new Relationship(
          'rel1',
          new EntityPointer('entity1'),
          new EntityPointer('entity2'),
          'type1'
        ),
        {
          entity1: { template: 'temp2', sharedId: 'entity1' },
          entity2: { template: 'temp3', sharedId: 'entity2' },
        }
      )
    ).toBe(undefined);

    expect(
      query.reachesRelationship(
        new Relationship('rel1', new EntityPointer('entity2'), new EntityPointer('root'), 'type1'),
        {
          root: { template: 'temp1', sharedId: 'root' },
          entity2: { template: 'temp2', sharedId: 'entity2' },
        }
      )
    ).toBe(undefined);
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
      query.reachesRelationship(
        new Relationship(
          'rel1',
          new EntityPointer('entity1'),
          new EntityPointer('entity2'),
          'type1'
        ),
        {
          entity1: { template: 'temp1', sharedId: 'entity1' },
          entity2: { template: 'temp2', sharedId: 'entity2' },
        }
      )
    ).toEqual(
      new MatchQueryNode({ sharedId: 'entity1' }, [
        new TraversalQueryNode('out', { _id: 'rel1' }, [
          new MatchQueryNode({ sharedId: 'entity2' }, []),
        ]),
      ])
    );

    expect(
      query.reachesRelationship(
        new Relationship(
          'rel1',
          new EntityPointer('entity2'),
          new EntityPointer('entity1'),
          'type2'
        ),
        {
          entity1: { template: 'temp2', sharedId: 'entity1' },
          entity2: { template: 'temp3', sharedId: 'entity2' },
        }
      )
    ).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ sharedId: 'entity1' }, [
            new TraversalQueryNode('in', { _id: 'rel1' }, [
              new MatchQueryNode({ sharedId: 'entity2' }, []),
            ]),
          ]),
        ]),
      ])
    );

    expect(
      query.reachesRelationship(
        new Relationship(
          'rel1',
          new EntityPointer('entity1'),
          new EntityPointer('entity2'),
          'type3'
        ),
        {
          entity1: { template: 'temp3', sharedId: 'entity1' },
          entity2: { template: 'temp4', sharedId: 'entity2' },
        }
      )
    ).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ templates: ['temp2'] }, [
            new TraversalQueryNode('in', { types: ['type2'] }, [
              new MatchQueryNode({ sharedId: 'entity1' }, [
                new TraversalQueryNode('out', { _id: 'rel1' }, [
                  new MatchQueryNode({ sharedId: 'entity2' }, []),
                ]),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  });

  it('should return the narrowed query that would match the query with repeated segments', () => {
    const query = new MatchQueryNode({ templates: ['temp1'] }, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['temp1'] }, [
          new TraversalQueryNode('in', { types: ['type1'] }, [
            new MatchQueryNode({ templates: ['temp1'] }),
          ]),
        ]),
      ]),
    ]);

    expect(
      query.reachesRelationship(
        new Relationship(
          'rel1',
          new EntityPointer('entity1'),
          new EntityPointer('entity2'),
          'type1'
        ),
        {
          entity1: { template: 'temp1', sharedId: 'entity1' },
          entity2: { template: 'temp1', sharedId: 'entity2' },
        }
      )
    ).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ sharedId: 'entity2' }, [
            new TraversalQueryNode('in', { _id: 'rel1' }, [
              new MatchQueryNode({ sharedId: 'entity1' }, []),
            ]),
          ]),
        ]),
      ])
    );
  });
});

describe('when calling reachesEntity()', () => {
  it('should return undefined if no match node of the query would match the given entity', () => {
    const query = new MatchQueryNode({ sharedId: 'root', templates: ['temp1'] }, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['temp2'] }, [
          new TraversalQueryNode('in', { types: ['type2'] }, [
            new MatchQueryNode({ templates: ['temp3'] }, []),
          ]),
        ]),
      ]),
    ]);

    expect(query.reachesEntity({ template: 'temp1', sharedId: 'entity1' })).toBe(undefined);
    expect(query.reachesEntity({ template: 'temp4', sharedId: 'root' })).toBe(undefined);
  });

  it('should not match if it does not need to traverse a relationship', () => {
    const query = new MatchQueryNode({ templates: ['temp1'] }, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['temp2'] }, []),
      ]),
    ]);

    expect(query.reachesEntity({ sharedId: 'entity1', template: 'temp1' })).toBe(undefined);
  });

  it('should return the narrowed query that would match the given entity', () => {
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

    expect(query.reachesEntity({ sharedId: 'entity1', template: 'temp2' })).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ sharedId: 'entity1' }, []),
        ]),
      ])
    );

    expect(query.reachesEntity({ sharedId: 'entity1', template: 'temp3' })).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ templates: ['temp2'] }, [
            new TraversalQueryNode('in', { types: ['type2'] }, [
              new MatchQueryNode({ sharedId: 'entity1' }, []),
            ]),
          ]),
        ]),
      ])
    );

    expect(query.reachesEntity({ template: 'temp4', sharedId: 'entity1' })).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ templates: ['temp2'] }, [
            new TraversalQueryNode('in', { types: ['type2'] }, [
              new MatchQueryNode({ templates: ['temp3'] }, [
                new TraversalQueryNode('out', { types: ['type3'] }, [
                  new MatchQueryNode({ sharedId: 'entity1' }, []),
                ]),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  });

  it('should return the narrowed query that would match the entity with repeated segments', () => {
    const query = new MatchQueryNode({ templates: ['temp1'] }, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['temp1'] }, [
          new TraversalQueryNode('in', { types: ['type1'] }, [
            new MatchQueryNode({ templates: ['temp1'] }, [
              new TraversalQueryNode('out', { types: ['type1'] }, [
                new MatchQueryNode({ templates: ['temp1'] }, []),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    expect(query.reachesEntity({ template: 'temp1', sharedId: 'entity1' })).toEqual(
      new MatchQueryNode({ templates: ['temp1'] }, [
        new TraversalQueryNode('out', { types: ['type1'] }, [
          new MatchQueryNode({ templates: ['temp1'] }, [
            new TraversalQueryNode('in', { types: ['type1'] }, [
              new MatchQueryNode({ templates: ['temp1'] }, [
                new TraversalQueryNode('out', { types: ['type1'] }, [
                  new MatchQueryNode({ sharedId: 'entity1' }, []),
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
        query.reachesRelationship(
          new Relationship(
            'fakeRel',
            new EntityPointer('entity1'),
            new EntityPointer('entity2'),
            'fakeType'
          ),
          {
            entity1: { sharedId: 'entity1', template: 'fakeTemplate' },
            entity2: { sharedId: 'entity2', template: 'fakeTemplate' },
          }
        );
      }).toThrow(NonChainQueryError);

      if (query !== query2) {
        expect(() => {
          query.reachesEntity({ sharedId: 'fakeEntity', template: 'fakeTemplate' });
        }).toThrow(NonChainQueryError);
      }
    }
  );
});

describe('when getting the templates matched by the leaf nodes', () => {
  it('should return an array containing the occurrences of the template ids', () => {
    /* eslint-disable */
    const query = new MatchQueryNode({ sharedId: 'root' }, [ // Root
      new TraversalQueryNode('out', {}, [ // R -> A
        new MatchQueryNode({}, [ // A
          new TraversalQueryNode('out', {}, [ // A -> B
            new MatchQueryNode({
              templates: ['template1', 'template2']
            }, []), //B
          ]),
          new TraversalQueryNode('out', {}, [ // A -> D
            new MatchQueryNode({}, []), // D
          ]),
        ]),
      ]),
      new TraversalQueryNode('out', {}, [ // R -> C
        new MatchQueryNode({ templates: ['template2'] }, []) // C
      ]),
    ]);
    /* eslint-enable */

    const templates = query.getTemplatesInLeaves();

    expect(templates).toEqual([
      { path: [0, 0, 0, 0], templates: ['template1', 'template2'] },
      { path: [0, 0, 1, 0], templates: [] },
      { path: [1, 0], templates: ['template2'] },
    ]);
  });
});
