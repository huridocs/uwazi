import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { RelationshipPropertyData } from 'shared/types/api.v2/templates.createTemplateRequest';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
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
  private templatesDataSource: TemplatesDataSource;

  constructor(templatesDataSource: TemplatesDataSource) {
    this.templatesDataSource = templatesDataSource;
  }

  private async validateQuery(query: MatchQueryNode, denormalizedProperty?: string) {
    if (!denormalizedProperty) {
      return;
    }

    const templatesInLeaves = query.getTemplatesInLeaves();
    const uniqueTemplates = Array.from(new Set(templatesInLeaves));

    const templatesHavingProperty = await this.templatesDataSource
      .getTemplatesHavingProperty(denormalizedProperty)
      .all();

    if (!uniqueTemplates.every(template => templatesHavingProperty.includes(template))) {
      throw new ValidationError([
        { path: '/query', message: 'all target entities have the property to denormalize' },
      ]);
    }
  }

  async createRelationshipProperty(property: RelationshipPropertyData) {
    const query = BuildQuery.build(property.query);
    await this.validateQuery(query, property.denormalizedProperty);
    return {
      ...property,
      query: QueryMapper.toDBO(query.getTraversals()),
    };
  }
}
