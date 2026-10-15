import { availableLanguages } from '#shared/language/index.js';
import { PermissionType } from '#shared/types/permissionSchema.js';
import type { ActivityData } from './RelatedData.js';

type Permission = { refId: string; type: string; level: string };

/** The wording of the names and details the catalog gives its entries. */
class ActivityFormatters {
  static formatLanguage(this: void, langKey: string): string {
    const lang = availableLanguages.find(({ key }) => key === langKey);
    return lang ? `${lang.label} (${lang.key})` : langKey;
  }

  static formatDataLanguage(this: void, data: ActivityData): string {
    return ActivityFormatters.formatLanguage(data.key);
  }

  static translationsName(this: void, data: ActivityData): string {
    const [context] = data.contexts;
    return data.contexts.length === 1
      ? `in ${context.label} (${context.id})`
      : 'in multiple contexts';
  }

  static nameFunc(this: void, data: ActivityData): string {
    return `${data.label} (${data.key})`;
  }

  static templateName(this: void, data: ActivityData): string {
    return data.templateData ? `${data.templateData.name} (${data._id})` : data._id;
  }

  static extraTemplate(this: void, data: ActivityData): string {
    return `of type ${
      data.templateData
        ? data.templateData.name
        : `(${data.template ? data.template.toString() : 'unassigned'})`
    }`;
  }

  static extraAttachmentLanguage(this: void, data: ActivityData): string | null {
    return data.entity
      ? `of entity '${data.entity.title}' (${
          data.entity.sharedId
        }) ${ActivityFormatters.formatLanguage(data.entity.language)} version`
      : null;
  }

  static updatedFile(this: void, data: ActivityData): string {
    return `${data.toc ? 'ToC, ' : ''}${data.title}`;
  }

  static groupMembers(this: void, data: ActivityData): string {
    const members = data.members.map((member: { username: string }) => member.username).join(', ');
    return members.length > 0 ? `with members: ${members}` : 'with no members';
  }

  static entitiesNames(this: void, data: ActivityData): string {
    return data.entities.map((e: { title: string }) => e.title).join(', ');
  }

  static loadAllowedUsersAndGroups(this: void, data: ActivityData): string {
    const permissions: Permission[] = data.permissions;
    const grantedUsers = permissions
      .filter(p => p.type === PermissionType.USER)
      .map(ActivityFormatters.holderName(data.users, 'username'))
      .join(', ');
    const grantedNames = permissions
      .filter(p => p.type === PermissionType.GROUP)
      .map(ActivityFormatters.holderName(data.userGroups, 'name'))
      .join(', ');

    return ` with permissions for${grantedUsers.length ? ` USERS: ${grantedUsers};` : ''}${
      grantedNames.length ? ` GROUPS: ${grantedNames}` : ''
    }${data.public ? '; PUBLIC' : ''}`;
  }

  private static holderName(source: ActivityData[], field: string) {
    return (p: Permission) => {
      const holder = source.find(u => u._id.toString() === p.refId);
      return `${holder && holder[field] ? holder[field] : p.refId} - ${p.level}`;
    };
  }
}

export { ActivityFormatters };
