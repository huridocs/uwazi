import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { EntityDoesNotExistError } from '#api/core/domain/entity/errors.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { MongoFilesDataSource } from '#api/core/infrastructure/mongodb/files/MongoFilesDataSource.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { TemplatesDataSource } from '#api/core/domain/template/TemplatesDataSource.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { filterMetadataRelationships } from './utils/filterMetadataRelationships.js';

type Deps = {
  entityDAO: MongoEntityDAO;
  permissionChecker: MongoEntityPermissionChecker;
  templatesDataSource: TemplatesDataSource;
  settingsDataSource: SettingsDataSource;
  relationshipsDataSource?: MongoRelationshipsV1DataSource;
  filesDataSource?: MongoFilesDataSource;
};

type Input = {
  sharedId: string;
  language?: LanguageISO6391;
  published?: boolean;
  includeRelationships?: boolean;
  isAuthenticated?: boolean;
  user?: User;
};

type Output = ResultType<EntityDBO, EntityDoesNotExistError>;

class GetEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { sharedId, language, published, includeRelationships, isAuthenticated, user } = input;

    // 1. Get entity
    const entityResult = await this.deps.entityDAO.getBySharedId(sharedId, language, published);

    if (entityResult.isError()) {
      return entityResult;
    }

    const entity = entityResult.getData();

    // 2. Filter metadata relationship properties based on permissions
    if (entity.template) {
      // Fetch the template to identify relationship properties
      const templateResult = await this.deps.templatesDataSource.getById(
        entity.template.toString()
      );

      if (templateResult.isOk()) {
        const template = templateResult.getData();

        // Get names of all relationship-type properties
        const relationshipPropertyNames = new Set(
          (template.properties || [])
            .filter(prop => prop.type === PropertyTypeEnum.Relationship)
            .map(prop => prop.name)
        );

        // Fetch the filterOut setting
        const filterOut = await this.deps.settingsDataSource.readFilterUnauthorizedRelated();

        // Filter metadata relationships based on user permissions
        entity.metadata = await filterMetadataRelationships(
          entity.metadata,
          relationshipPropertyNames,
          this.deps.permissionChecker,
          user,
          filterOut
        );
      }
    }

    // 3. Optionally fetch relationships
    if (includeRelationships && this.deps.relationshipsDataSource && language) {
      const includeUnpublished = isAuthenticated ?? false;
      const relations = await this.deps.relationshipsDataSource.getByEntity(
        sharedId,
        language,
        includeUnpublished
      );

      // 4. Filter unpublished relationships for unauthenticated users (defensive check)
      const filteredRelations = isAuthenticated
        ? relations
        : relations.filter(rel => (rel.entityData as any)?.published !== false);

      // 5. Add relations to entity
      (entity as any).relations = filteredRelations;
    }

    // 6. Fetch files (documents and attachments)
    if (this.deps.filesDataSource) {
      const filesResultSet = this.deps.filesDataSource.getByEntitiesIds([sharedId]);
      const files = await filesResultSet.all();

      // Convert to DTO format and separate by type
      const fileDTOs = files.map((file: BaseFile) => file.toDTO());
      (entity as any).documents = fileDTOs.filter(f => f.type === 'document');
      (entity as any).attachments = fileDTOs.filter(f => f.type === 'attachment');
    } else {
      // Provide empty arrays when filesDataSource is not available
      (entity as any).documents = [];
      (entity as any).attachments = [];
    }

    return Result.ok(entity);
  }
}

export { GetEntityUseCase };
export type { Input as GetEntityInput, Output as GetEntityOutput };
