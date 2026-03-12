import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { fileDBO, fileDTO } from '../infrastructure/mongodb/files/schemas/filesTypes.js';
import { EntitiesQueryService } from './EntitiesQueryService.js';
import { GetEntityResponseDTO, RelationDTO } from './GetEntityResponseDTO.js';

type Deps = {
  entityDAO: MongoEntityDAO;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
  entitiesQueryService: EntitiesQueryService;
};

type Input = {
  sharedId: string;
  includeRelationships?: boolean;
};

type Output = ResultType<GetEntityResponseDTO, EntityNotFoundError>;

// Helper to convert fileDBO (with ObjectId) to fileDTO (with string _id)
function convertFilesToDTO(files: fileDBO[]): fileDTO[] {
  return files.map(file => ({
    ...file,
    _id: file._id.toString(),
  })) as fileDTO[];
}

class GetEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { sharedId, includeRelationships } = input;
    const language = this.targetLanguage;
    const isAuthenticated = !!this.actor;
    const user = isAuthenticated ? this.getActor() : undefined;

    const entity = await this.deps.entityDAO
      .getWithFiles({
        sharedId,
        language,
      })
      .next();

    if (!entity) {
      return Result.fail(new EntityNotFoundError(sharedId));
    }

    // Authorization check: unauthenticated users cannot access unpublished entities
    if (!isAuthenticated && entity.published === false) {
      return Result.fail(new EntityNotFoundError(sharedId));
    }

    // Use EntitiesQueryService to filter metadata relationship properties with batch optimization
    const filteredMetadataMap =
      await this.deps.entitiesQueryService.authorizeRelationshipProperties([entity], user);

    entity.metadata = filteredMetadataMap.get(entity.sharedId)!;

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
      documents: convertFilesToDTO(entity.documents),
      attachments: convertFilesToDTO(entity.attachments),
      ...(includeRelationships && { relations: filteredRelations }),
    };

    return Result.ok(response);
  }
}

export { GetEntityUseCase };
export type { Input as GetEntityInput, Output as GetEntityOutput };
