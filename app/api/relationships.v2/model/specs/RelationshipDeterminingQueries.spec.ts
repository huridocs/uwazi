import { MatchQueryNode } from '../MatchQueryNode';
import { TraversalQueryNode } from '../TraversalQueryNode';

describe('when checkin if, given an entity, the query defines a relationship', () => {
  it('should be true if it is a 1 hop, 1 relationship type query', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [new MatchQueryNode({})]),
    ]);

    expect(query.determinesRelationships()).toEqual([]);
  });

  it('should be false if any branch is longer than 1', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [new MatchQueryNode({})]),
      new TraversalQueryNode('out', { types: ['type2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['type1'] }, [new MatchQueryNode({})]),
        ]),
      ]),
    ]);

    expect(query.determinesRelationships()).toEqual(false);
  });

  it('should be false if not every branch has only one relationship type', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [new MatchQueryNode({})]),
      new TraversalQueryNode('out', { types: ['type2', 'type3'] }, [new MatchQueryNode({})]),
    ]);

    expect(query.determinesRelationships()).toBe(false);
  });

  it('should be false if a template appears in 2 or more branches', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['template1'] }),
      ]),
      new TraversalQueryNode('out', { types: ['type2'] }, [
        new MatchQueryNode({ templates: ['template1'] }),
      ]),
    ]);

    expect(query.determinesRelationships()).toBe(false);
  });

  it('should be false if "all templates" is used and there are more than one branches', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [new MatchQueryNode()]),
      new TraversalQueryNode('out', { types: ['type2'] }, [
        new MatchQueryNode({ templates: ['template1'] }),
      ]),
    ]);

    expect(query.determinesRelationships()).toBe(false);
  });

  it('should be true if it is 1 hop, 1 rel type per branch and templates appear once', () => {
    const query1 = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['template1'] }),
      ]),
      new TraversalQueryNode('out', { types: ['type2'] }, [
        new MatchQueryNode({ templates: ['template2'] }),
      ]),
    ]);

    const query2 = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [new MatchQueryNode()]),
    ]);

    expect(query1.determinesRelationships()).toEqual(['template1', 'template2']);
    expect(query2.determinesRelationships()).toEqual([]);
  });
});

describe('when determining a relationship', () => {
  const entity = { sharedId: 'sharedId', template: 'template4' };
  const rootEntity = { sharedId: 'shared1', template: 'some template' };

  it('should validate that the entity is matched by one of the match nodes', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['template1', 'template2'] }),
      ]),
      new TraversalQueryNode('out', { types: ['type2'] }, [
        new MatchQueryNode({ templates: ['template3'] }),
      ]),
    ]);

    expect(() => query.determineRelationship(rootEntity, entity)).toThrow();
  });

  it('should return the correct relationship', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', { types: ['type1'] }, [
        new MatchQueryNode({ templates: ['template1', 'template2'] }),
      ]),
      new TraversalQueryNode('in', { types: ['type2'] }, [
        new MatchQueryNode({ templates: ['template3', 'template4'] }),
      ]),
    ]);

    expect(query.determineRelationship(rootEntity, entity)).toEqual({
      type: 'type2',
      from: entity.sharedId,
      to: 'shared1',
    });
  });
});

describe('when calculating the depth of a query', () => {
  it('shuold return 0 for a single node', () => {
    const query = new MatchQueryNode({});
    expect(query.getDepth()).toBe(0);
  });

  it('should return the max depth of the tree', () => {
    const query = new MatchQueryNode({}, [
      new TraversalQueryNode('out', {}, [new MatchQueryNode({})]),
      new TraversalQueryNode('out', {}, [
        new MatchQueryNode({}, [new TraversalQueryNode('out', {}, [new MatchQueryNode({})])]),
      ]),
    ]);

    expect(query.getDepth()).toBe(4);
  });
});
