import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { RelationshipType } from 'api/relationshiptypes.v2/model/RelationshipType';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { Relationship, ReadableRelationship } from '../model/Relationship';

const resolveNames = (
  allowedEntities: Entity[],
  allowedTemplates: Template[],
  allowedRelTypes: RelationshipType[],
  allowedRelationships: Relationship[]
): ReadableRelationship[] => {
  const entitiesById = objectIndex(
    allowedEntities,
    entity => entity.sharedId,
    entity => entity
  );
  const templateNamesById = objectIndex(
    allowedTemplates,
    template => template.id,
    template => template.name
  );
  const relTypesById = objectIndex(
    allowedRelTypes,
    relType => relType.id,
    relType => relType.name
  );

  const relationshipsWithEntityData = allowedRelationships.map(relationship =>
    ReadableRelationship.fromRelationship(
      relationship,
      entitiesById[relationship.from.entity].title,
      templateNamesById[entitiesById[relationship.from.entity].template],
      entitiesById[relationship.to.entity].title,
      templateNamesById[entitiesById[relationship.to.entity].template],
      relTypesById[relationship.type]
    )
  );
  return relationshipsWithEntityData;
};

class GetRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private authService: AuthorizationService;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private relationshipTypesDS: RelationshipTypesDataSource;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    authService: AuthorizationService,
    entitiesDS: EntitiesDataSource,
    templatesDS: TemplatesDataSource,
    relationshipTypesDS: RelationshipTypesDataSource
  ) {
    this.relationshipsDS = relationshipsDS;
    this.authService = authService;
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.relationshipTypesDS = relationshipTypesDS;
  }

  async getByEntity(sharedId: string): Promise<ReadableRelationship[]> {
    const relationships = await this.relationshipsDS.getByEntities([sharedId]).all();
    const allowedRelationships = await this.authService.filterRelationships(relationships, 'read');
    const allowedSharedIds = Relationship.getSharedIds(allowedRelationships);
    const allowedEntities = await this.entitiesDS.getByIds([...allowedSharedIds]).all();
    const allowedTemplates = await this.templatesDS
      .getByIds(allowedEntities.map(entity => entity.template))
      .all();
    const allowedRelTypes = await this.relationshipTypesDS
      .getByIds(allowedRelationships.map(relationship => relationship.type))
      .all();

    const readableRelationships = resolveNames(
      allowedEntities,
      allowedTemplates,
      allowedRelTypes,
      allowedRelationships
    );

    return readableRelationships;
  }
}

export { GetRelationshipService };
