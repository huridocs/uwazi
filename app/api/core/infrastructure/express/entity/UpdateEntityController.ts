import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { UpdateEntityRequest, UpdateEntitySchema } from './Schemas';
import { UpdateEntityUseCaseFactory } from '../../factories/UpdateEntityUseCaseFactory';
import { ExpressEntityMapper } from './ExpressEntityMapper';
import { MongoEntityMapper } from '../../mongodb/entity/MongoEntityMapper';

type Request = UpdateEntityRequest | { entity: string };

class UpdateEntityController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const useCase = UpdateEntityUseCaseFactory.default();

    let parsed: UpdateEntityRequest;

    if ('entity' in this.request.body) {
      parsed = UpdateEntitySchema.parse(JSON.parse(this.request.body.entity));
    } else {
      parsed = UpdateEntitySchema.parse(this.request.body);
    }

    const mapped = ExpressEntityMapper.toEntityUpdateInput({
      dto: parsed,
      inputFiles: this.request.inputFiles,
    });

    const entityUpdated = await useCase.execute(mapped);

    const entityDbo = MongoEntityMapper.toDBO(entityUpdated).find(
      e => e.language === parsed.language
    )!;

    this.response.json(entityDbo);
    this.request.emitToSessionSocket(
      'documentProcessed',
      this.request.body.entity ? entityDbo.sharedId : entityDbo.sharedId
    );
  }
}

export { UpdateEntityController };
