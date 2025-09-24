// @ts-expect-error TS(2307): Cannot find module '../authorization.v2/services/A... Remove this comment to see the full error message
import { AuthorizationService } from '../authorization.v2/services/AuthorizationService.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/contracts/Entit... Remove this comment to see the full error message
import { EntitiesDataSource } from '../entities.v2/contracts/EntitiesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/model/Entity.js... Remove this comment to see the full error message
import { Entity } from '../entities.v2/model/Entity.js';
// @ts-expect-error TS(2307): Cannot find module '../relationshiptypes.v2/contra... Remove this comment to see the full error message
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../relationshiptypes.v2/model/... Remove this comment to see the full error message
import { RelationshipType } from 'api/relationshiptypes.v2/model/RelationshipType.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { objectIndex } from 'shared/data_utils/objectIndex.js';
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
    // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
    entity => entity.sharedId,
    // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
    entity => entity
  );
  const templateNamesById = objectIndex(
    allowedTemplates,
    // @ts-expect-error TS(7006): Parameter 'template' implicitly has an 'any' type.
    template => template.id,
    // @ts-expect-error TS(7006): Parameter 'template' implicitly has an 'any' type.
    template => template.name
  );
  const relTypesById = objectIndex(
    allowedRelTypes,
    // @ts-expect-error TS(7006): Parameter 'relType' implicitly has an 'any' type.
    relType => relType.id,
    // @ts-expect-error TS(7006): Parameter 'relType' implicitly has an 'any' type.
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
      // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
      .getByIds(allowedEntities.map(entity => entity.template))
      .all();
    const allowedRelTypes = await this.relationshipTypesDS
      // @ts-expect-error TS(7006): Parameter 'relationship' implicitly has an 'any' t... Remove this comment to see the full error message
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
