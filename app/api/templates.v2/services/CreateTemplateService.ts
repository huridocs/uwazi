import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { RelationshipPropertyData } from 'shared/types/api.v2/templates.createTemplateRequest';
import { QueryMapper } from '../database/QueryMapper';

interface MatchQuery {
  templates: string[];
  traverse?: TraverseQuery[];
}

interface TraverseQuery {
  direction: 'in' | 'out';
  types: string[];
  match: MatchQuery[];
}

const BuildQuery = {
  traverse: (query: TraverseQuery): TraversalQueryNode =>
    new TraversalQueryNode(
      query.direction,
      { types: query.types },
      query.match.map(BuildQuery.match)
    ),
  match: (query: MatchQuery): MatchQueryNode =>
    new MatchQueryNode(
      { templates: query.templates },
      query.traverse?.map(BuildQuery.traverse) ?? []
    ),
  build: (traversals: TraverseQuery[]) =>
    new MatchQueryNode({}, traversals.map(BuildQuery.traverse)),
};

export class CreateTemplateService {
  private validateQuery(query: MatchQueryNode) {
    const templatesInLeaves = query.getTemplatesInLeaves();
    const uniqueTemplates = new Set(templatesInLeaves);
    if (uniqueTemplates.size > 1) {
      throw new ValidationError([
        { path: '/query', message: 'all target entities must be of the same template' },
      ]);
    }
  }

  createRelationshipProperty(property: RelationshipPropertyData) {
    const query = BuildQuery.build(property.query);
    this.validateQuery(query);
    return {
      ...property,
      query: QueryMapper.toDBO(query.getTraversals()),
    };
  }
}
