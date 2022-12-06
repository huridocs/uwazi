import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { RelationshipProperty } from '../RelationshipProperty';

describe('buildQueryRootedInTemplate()', () => {
  it('should return query traversing from the entities of the template of the property to the configured pathes', () => {
    const property = new RelationshipProperty(
      'prop1',
      'prop1',
      [new TraversalQueryNode('out', {}, [new MatchQueryNode()])],
      'title',
      'template1'
    );
    expect(property.buildQueryRootedInTemplate()).toEqual(
      new MatchQueryNode({ templates: ['template1'] }, property.query)
    );
  });
});
