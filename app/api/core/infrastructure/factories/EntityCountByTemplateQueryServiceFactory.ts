import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import {
  EntityCountByTemplateQueryService,
  type EntityCountByTemplateQuery,
} from '../entity/EntityCountByTemplateQueryService.js';

class EntityCountByTemplateQueryServiceFactory {
  static default(): EntityCountByTemplateQuery {
    return new EntityCountByTemplateQueryService({
      entitiesDAO: EntitiesDAOFactory.default(),
      templatesDAO: TemplatesDAOFactory.default(),
    });
  }
}

export { EntityCountByTemplateQueryServiceFactory };
