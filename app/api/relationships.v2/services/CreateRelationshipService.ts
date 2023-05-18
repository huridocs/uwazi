import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { MissingRelationshipTypeError } from 'api/relationshiptypes.v2/errors/relationshipTypeErrors';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import {
  EntityPointer,
  Relationship,
  TextReferencePointer,
  Selection,
} from '../model/Relationship';
import { DenormalizationService } from './DenormalizationService';

interface ReferencePointerData {
  type: 'text';
  entity: string;
  file: string;
  selections: {
    page: number;
    top: number;
    left: number;
    width: number;
    height: number;
  }[];
  text: string;
}

interface EntityPointerData {
  type: 'entity';
  entity: string;
}

interface CreateRelationshipData {
  from: EntityPointerData | ReferencePointerData;
  to: EntityPointerData | ReferencePointerData;
  type: string;
}

function mapDataToSelection(data: ReferencePointerData['selections']) {
  return data.map(
    selectionData =>
      new Selection(
        selectionData.page,
        selectionData.top,
        selectionData.left,
        selectionData.height,
        selectionData.width
      )
  );
}

function mapDataToPointer(data: CreateRelationshipData['from' | 'to']) {
  return data.type === 'text'
    ? new TextReferencePointer(
        data.entity,
        data.file,
        mapDataToSelection(data.selections),
        data.text
      )
    : new EntityPointer(data.entity);
}

function mapDataToRelationship(data: CreateRelationshipData, generateId: () => string) {
  return new Relationship(
    generateId(),
    mapDataToPointer(data.from),
    mapDataToPointer(data.to),
    data.type
  );
}
export class CreateRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private filesDS: FilesDataSource;

  private transactionManager: TransactionManager;

  private relationshipTypesDS: RelationshipTypesDataSource;

  private idGenerator: IdGenerator;

  private authService: AuthorizationService;

  private denormalizationService: DenormalizationService;

  // eslint-disable-next-line max-params
  constructor(
    relationshipsDS: RelationshipsDataSource,
    relationshipTypesDS: RelationshipTypesDataSource,
    entitiesDS: EntitiesDataSource,
    filesDS: FilesDataSource,
    transactionManager: TransactionManager,
    idGenerator: IdGenerator,
    authService: AuthorizationService,
    denormalizationService: DenormalizationService
  ) {
    this.relationshipsDS = relationshipsDS;
    this.relationshipTypesDS = relationshipTypesDS;
    this.entitiesDS = entitiesDS;
    this.filesDS = filesDS;
    this.transactionManager = transactionManager;
    this.idGenerator = idGenerator;
    this.authService = authService;
    this.denormalizationService = denormalizationService;
  }

  private processInput(relationships: CreateRelationshipData[]) {
    const models: Relationship[] = [];
    const types = new Set<string>();
    const sharedIds = new Set<string>();
    const files: { _id: string; entity: string }[] = [];

    relationships.forEach(data => {
      const relationship = mapDataToRelationship(data, this.idGenerator.generate);

      models.push(relationship);
      types.add(relationship.type);

      (['from', 'to'] as const).forEach(side => {
        const pointer = relationship[side];

        sharedIds.add(pointer.entity);
        if (pointer instanceof TextReferencePointer) {
          files.push({ entity: pointer.entity, _id: pointer.file });
        }
      });
    });

    return {
      models,
      usedTypes: Array.from(types),
      relatedEntities: Array.from(sharedIds),
      relatedFilesForEntities: files,
    };
  }

  async create(relationships: CreateRelationshipData[]) {
    if (!relationships.length) {
      return [];
    }

    const { models, usedTypes, relatedEntities, relatedFilesForEntities } =
      this.processInput(relationships);

    await this.authService.validateAccess('write', relatedEntities);

    if (!(await this.relationshipTypesDS.typesExist(usedTypes))) {
      throw new MissingRelationshipTypeError('Must provide id for existing relationship type');
    }
    if (!(await this.entitiesDS.entitiesExist(relatedEntities))) {
      throw new MissingEntityError('Must provide sharedIds from existing entities');
    }
    if (
      relatedFilesForEntities.length &&
      !(await this.filesDS.filesExistForEntities(relatedFilesForEntities))
    ) {
      throw new Error('Must provide id for files that belong to the provided entities');
    }

    const created = await this.transactionManager.run(async () => {
      const insertedRelationships = await this.relationshipsDS.insert(models);

      await this.denormalizationService.denormalizeAfterCreatingRelationships(
        insertedRelationships.map(relationship => relationship._id)
      );

      return insertedRelationships;
    });

    return created;
  }
}
