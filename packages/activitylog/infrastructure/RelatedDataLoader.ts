import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { UserGroupsDirectoryFactory } from '#api/core/infrastructure/factories/UserGroupsDirectoryFactory.js';
import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import entities from '#api/entities/entities.js';
import { Extractors } from '#api/services/informationextraction/ixextractors.js';
import { Suggestions } from '#api/suggestions/suggestions.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import type { ActivityData } from '../application/contracts/RelatedData.js';

/**
 * Reads what the describer needs from the modules that own it, V1 ones included. Stateless: the
 * class itself is the `RelatedData` the describer is given.
 */
class RelatedDataLoader {
  static async entity(this: void, data: ActivityData): Promise<ActivityData> {
    const _id = data.entityId || data._id;
    const sharedId = data.sharedId || data.entity;
    const query = { ...(_id && { _id }), ...(sharedId && { sharedId }) };
    const [entity] = await entities.getUnrestricted(query);
    return { ...data, entity, title: entity ? entity.title : undefined };
  }

  static async entityFromPublicForm(this: void, data: ActivityData): Promise<ActivityData> {
    const entity = typeof data.entity === 'string' ? JSON.parse(data.entity) : data.entity;
    const templateData = await templates.getById(entity.template);
    return { ...data, templateData, title: entity.title };
  }

  static async template(this: void, data: ActivityData): Promise<ActivityData> {
    const templateId = data.entity ? JSON.parse(data.entity).template : data.template || data._id;
    const templateData = templateId ? await templates.getById(templateId) : undefined;
    return { ...data, templateData };
  }

  static async file(this: void, data: ActivityData): Promise<ActivityData> {
    const file = (await FilesDAOFactory.default().getById(data._id.toString())).getData(null);
    return { ...data, file, title: file ? file.originalname : `id: ${data._id}` };
  }

  /** Holders that cannot be resolved (soft-deleted included) are left to print as their raw id. */
  static async permissions(this: void, data: ActivityData): Promise<ActivityData> {
    const permissions: { refId: string; type: string }[] = data.permissions;
    const holderIds = permissions.filter(p => p.type !== PermissionType.PUBLIC).map(p => p.refId);

    return {
      ...data,
      entities: await entities.getUnrestricted({ sharedId: { $in: data.ids } }, { title: 1 }),
      users: await UsersDirectoryFactory.default().getManyByIds(holderIds),
      userGroups: await UserGroupsDirectoryFactory.default().getManyByIds(holderIds),
      public: permissions.some(p => p.type === PermissionType.PUBLIC),
    };
  }

  static async suggestion(this: void, data: ActivityData): Promise<ActivityData> {
    const suggestion = await Suggestions.getById(data.suggestion._id);
    const entity = await entities.getById(data.suggestion.entityId);
    const extractor = await Extractors.getById(suggestion!.extractorId);
    return { ...data, ...suggestion, title: entity?.title, extractorName: extractor!.name };
  }

  static async extractor(this: void, data: ActivityData): Promise<ActivityData> {
    const extractor = await Extractors.getById(data.extractorId);
    return { ...data, ...extractor };
  }

  /** A user that cannot be resolved is named by its raw id. */
  static async user(this: void, data: ActivityData): Promise<ActivityData> {
    const user = (await UsersDirectoryFactory.default().getById(data._id.toString())).getData();
    return { ...data, ...(user || { username: data._id.toString() }) };
  }
}

export { RelatedDataLoader };
