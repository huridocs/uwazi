import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { EntityDoesNotExistError } from '#api/core/domain/entity/errors.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { TemplatesDataSource } from '#api/core/domain/template/TemplatesDataSource.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { MongoFilesDataSource } from '#api/core/infrastructure/mongodb/files/MongoFilesDataSource.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { User } from '#api/users.v2/model/User.js';
import { fileDTO } from '../infrastructure/mongodb/files/schemas/filesTypes.js';
import { GetEntityResponseDTO, RelationDTO } from './GetEntityResponseDTO.js';
import { filterMetadataRelationships } from './utils/filterMetadataRelationships.js';

type Deps = {
  entityDAO: MongoEntityDAO;
  permissionChecker: MongoEntityPermissionChecker;
  templatesDataSource: TemplatesDataSource;
  settingsDataSource: SettingsDataSource;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
  filesDataSource: MongoFilesDataSource;
};

type Input = {
  sharedId: string;
  published?: boolean;
  includeRelationships?: boolean;
};

type Output = ResultType<GetEntityResponseDTO, EntityDoesNotExistError>;

class GetEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { sharedId, published, includeRelationships } = input;
    const language = this.targetLanguage;
    const isAuthenticated = !!this.actor;
    const user = isAuthenticated ? this.getActor() : undefined;

    const entityResult = await this.deps.entityDAO.getBySharedId(sharedId, language, published);

    if (entityResult.isError()) {
      return entityResult;
    }

    const entity = entityResult.getData();

    const templateResult = await this.deps.templatesDataSource.getById(entity.template.toString());

    if (templateResult.isOk()) {
      const template = templateResult.getData();

      // Get names of all relationship-type properties
      const relationshipPropertyNames = new Set(
        (template.properties || [])
          .filter(prop => prop.type === PropertyTypeEnum.Relationship)
          .map(prop => prop.name)
      );

      const filterUnauthorized = await this.deps.settingsDataSource.readFilterUnauthorizedRelated();

      entity.metadata = await filterMetadataRelationships(
        entity.metadata,
        relationshipPropertyNames,
        this.deps.permissionChecker,
        user,
        filterUnauthorized
      );
    }

    let fileDTOs: fileDTO[] = [];

    const filesResultSet = this.deps.filesDataSource.getByEntitiesIds([sharedId]);
    const files = await filesResultSet.all();
    fileDTOs = files.map((file: BaseFile) => file.toDTO());

    let filteredRelations: RelationDTO[] = [];
    if (includeRelationships) {
      const includeUnpublished = isAuthenticated ?? false;
      const relations = (await this.deps.relationshipsDataSource.getByEntity(
        sharedId,
        language,
        includeUnpublished
      )) as RelationDTO[];

      filteredRelations = isAuthenticated
        ? relations
        : relations.filter(rel => rel.entityData?.published !== false);
    }

    const response: GetEntityResponseDTO = {
      ...entity,
      documents: fileDTOs.filter(f => f.type === 'document'),
      attachments: fileDTOs.filter(f => f.type === 'attachment'),
      ...(includeRelationships && { relations: filteredRelations }),
    };

    return Result.ok(response);
  }
}

export { GetEntityUseCase };
export type { Input as GetEntityInput, Output as GetEntityOutput };
