import { Entity } from 'api/entities.v2/model/Entity';
import { GraphQueryResult } from '../GraphQueryResult';
import { Relationship } from '../Relationship';

const path = [
  new Entity('1', 'en', '1', '1', {}),
  Relationship.create('2', '1', '3', '2'),
  new Entity('3', 'en', '3', '3', {}),
  Relationship.create('4', '3', '5', '4'),
  new Entity('5', 'en,', '5', '5', {}),
];

const result = new GraphQueryResult(path);

describe('when construting from a query matched path', () => {
  it('should segregate the contents by type', () => {
    expect(result.path).toBe(path);
    expect(result.entities).toEqual([path[0], path[2], path[4]]);
    expect(result.relationships).toEqual([path[1], path[3]]);
  });
});

describe('when calling leaf()', () => {
  it('should return the entity at the end of the path', () => {
    expect(result.leaf()).toBe(path[4]);
  });
});
