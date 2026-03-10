import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const fixtureFactory = getFixturesFactory();

describe('buildQueryRootedInTemplate()', () => {
  it('should return query traversing from the entities of the template of the property to the configured pathes', () => {
    const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
      new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
    ]);

    expect(property.buildQueryRootedInTemplate()).toEqual(
      new MatchQueryNode({ templates: [fixtureFactory.id('template1').toString()] }, property.query)
    );
  });
});

describe('buildQueryRootedInEntity()', () => {
  it('should return query traversing from the entity with the provided sharedId to the configured pathes', () => {
    const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
      new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
    ]);

    expect(property.buildQueryRootedInEntity('testSharedId')).toEqual(
      new MatchQueryNode({ sharedId: 'testSharedId' }, property.query)
    );
  });
});

describe('queryUsesTemplate', () => {
  const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
    new TraversalQueryNode('out', {}, [
      new MatchQueryNode(
        {
          templates: ['template2'],
        },
        [
          new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
        ]
      ),
    ]),
    new TraversalQueryNode('in', {}, [new MatchQueryNode({ templates: ['template3'] })]),
  ]);

  it('should return true if the query is using the template', () => {
    expect(property.queryUsesTemplate('template2')).toBe(true);
  });

  it('should return false if the query is not using the template', () => {
    expect(property.queryUsesTemplate('template1')).toBe(false);
  });
});

describe('queryUsesRelationType', () => {
  const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
    new TraversalQueryNode('out', { types: ['relType2'] }, [
      new MatchQueryNode({}, [
        new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
        new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
      ]),
    ]),
    new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
  ]);

  it('should return true if the query is using the template', () => {
    expect(property.queryUsesRelationType('relType1')).toBe(true);
  });

  it('should return false if the query is not using the template', () => {
    expect(property.queryUsesRelationType('relType3')).toBe(false);
  });
});

describe('hasSameQuery', () => {
  const property = fixtureFactory.v2.application.relationshipProperty('prop1', 'template1', [
    new TraversalQueryNode('out', { types: ['relType2'] }, [
      new MatchQueryNode({}, [
        new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
        new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
      ]),
    ]),
    new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
  ]);

  it('should return true if the queries are the same', () => {
    const property2 = fixtureFactory.v2.application.relationshipProperty('prop2', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    expect(property.hasSameQuery(property2)).toBe(true);
  });

  it('should return false if the queries differ in attributes', () => {
    const property2 = fixtureFactory.v2.application.relationshipProperty('prop2', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['different rel type'] }, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    expect(property.hasSameQuery(property2)).toBe(false);
  });

  it('should return false if the queries have branches swap', () => {
    const property2 = fixtureFactory.v2.application.relationshipProperty('prop2', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
          new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    expect(property.hasSameQuery(property2)).toBe(false);
  });

  it('should return false if the queries have different quantity of branches', () => {
    const property2 = fixtureFactory.v2.application.relationshipProperty('prop2', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
        ]),
      ]),
    ]);

    const property3 = fixtureFactory.v2.application.relationshipProperty('prop3', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
      new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
    ]);

    const property4 = fixtureFactory.v2.application.relationshipProperty('prop4', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    const property5 = fixtureFactory.v2.application.relationshipProperty('prop5', 'template1', [
      new TraversalQueryNode('out', { types: ['relType2'] }, [
        new MatchQueryNode({}, [
          new TraversalQueryNode('out', { types: ['relType1'] }, [new MatchQueryNode()]),
          new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
          new TraversalQueryNode('out', {}, [new MatchQueryNode()]),
        ]),
      ]),
      new TraversalQueryNode('in', {}, [new MatchQueryNode()]),
    ]);

    expect(property.hasSameQuery(property2)).toBe(false);
    expect(property.hasSameQuery(property3)).toBe(false);
    expect(property.hasSameQuery(property4)).toBe(false);
    expect(property.hasSameQuery(property5)).toBe(false);
  });
});
