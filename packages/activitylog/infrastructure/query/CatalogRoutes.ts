import type { ActivityAction } from './ActivityDescription.js';
import { ActivityFormatters } from './ActivityFormatters.js';
import type { ActivityData, RelatedDataKind } from './RelatedData.js';

/** How the requests to one route are described. */
type RouteDescriptor = {
  desc: string;
  method?: ActivityAction;
  idField?: string;
  nameField?: string;
  nameFunc?: (data: ActivityData) => string;
  extra?: (data: ActivityData) => string | null;
  related?: RelatedDataKind;
};

/** Every route the activity log knows how to describe, keyed by method and path. */
const CATALOG_ROUTES: Readonly<Record<string, RouteDescriptor>> = {
  'POST/api/users': {
    desc: 'Updated user',
    method: 'UPDATE',
    idField: '_id',
    nameField: 'username',
  },
  'POST/api/entities/multipleupdate': { desc: 'Updated multiple entities' },
  'POST/api/entities/bulkdelete': { desc: 'Deleted multiple entities', method: 'DELETE' },
  'POST/api/attachments/upload': {
    desc: 'Uploaded attachment',
    method: 'CREATE',
    related: 'entity',
    nameField: 'title',
  },
  'POST/api/settings': { desc: 'Updated settings' },
  'POST/api/relationships/bulk': { desc: 'Updated relationships' },
  'POST/api/upload': { desc: 'Uploaded document', method: 'CREATE' },
  'POST/api/reupload': { desc: 'Re-uploaded document' },
  'POST/api/customisation/upload': { desc: 'Uploaded custom file', method: 'CREATE' },
  'POST/api/public': {
    desc: 'Created entity coming from a public form',
    method: 'CREATE',
    nameField: 'title',
    related: 'entityFromPublicForm',
    extra: ActivityFormatters.extraTemplate,
  },
  'POST/api/remotepublic': {
    desc: 'Submitted entity to a remote instance',
    method: 'CREATE',
  },
  'POST/api/references': { desc: 'Created relationship', method: 'CREATE', idField: '_id' },
  'POST/api/pages': {
    desc: 'Created page',
    method: 'CREATE',
    idField: 'sharedId',
    nameField: 'title',
  },
  'POST/api/pages/release': {
    desc: 'Published page release',
    method: 'UPDATE',
    nameField: 'sharedId',
    nameFunc: data => {
      const title = data.title || data.sharedId || '';
      return data.sharedId ? `${title} (${data.sharedId})` : title;
    },
    extra: data => {
      const parts: string[] = [];
      if (data.version != null) {
        parts.push(`v${data.version}`);
      }
      if (data.release_message) {
        parts.push(`"${data.release_message}"`);
      }
      return parts.join(' ');
    },
  },
  'POST/api/pages/restore': {
    desc: 'Restored page draft from release',
    method: 'UPDATE',
    nameField: 'sharedId',
    extra: data => (data.version != null ? `version ${data.version}` : ''),
  },
  'POST/api/templates': {
    desc: 'Created template',
    method: 'CREATE',
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/thesauris': {
    desc: 'Created thesaurus',
    method: 'CREATE',
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/relationtypes': {
    desc: 'Created relation type',
    method: 'CREATE',
    idField: '_id',
    nameField: 'name',
  },
  'POST/api/translations/import': {
    desc: 'Imported translations from file',
    method: 'UPDATE',
  },
  'POST/api/entities': {
    desc: 'Created entity',
    method: 'CREATE',
    idField: 'sharedId',
    nameField: 'title',
    nameFunc: data => {
      const body = data.entity ? JSON.parse(data.entity) : data;
      return body.sharedId ? `${body.title} (${body.sharedId})` : body.title;
    },
    related: 'template',
    extra: ActivityFormatters.extraTemplate,
  },
  'POST/api/documents': {
    desc: 'Created entity',
    method: 'CREATE',
    idField: 'sharedId',
    nameField: 'title',
    related: 'template',
    extra: ActivityFormatters.extraTemplate,
  },
  'DELETE/api/entities': {
    desc: 'Deleted entity',
    method: 'DELETE',
    nameField: 'sharedId',
  },
  'DELETE/api/documents': {
    desc: 'Deleted entity',
    method: 'DELETE',
    nameField: 'sharedId',
  },
  'POST/api/attachments/rename': {
    desc: 'Renamed attachment',
    idField: '_id',
    nameFunc: data => `${data.originalname} (${data._id})`,
    related: 'entity',
    extra: ActivityFormatters.extraAttachmentLanguage,
  },
  'DELETE/api/attachments/delete': {
    desc: 'Deleted attachment',
    method: 'DELETE',
    nameField: 'attachmentId',
  },
  'POST/api/templates/setasdefault': {
    desc: 'Set default template',
    related: 'template',
    nameFunc: ActivityFormatters.templateName,
  },
  'DELETE/api/templates': { desc: 'Deleted template', method: 'DELETE', nameField: '_id' },
  'DELETE/api/thesauris': { desc: 'Deleted thesaurus', method: 'DELETE', nameField: '_id' },
  'DELETE/api/relationtypes': {
    desc: 'Deleted relation type',
    method: 'DELETE',
    nameField: '_id',
  },
  'POST/api/translations': {
    desc: 'Updated translations',
    nameFunc: ActivityFormatters.translationsName,
    extra: data => `in ${ActivityFormatters.formatLanguage(data.locale)}`,
  },
  'POST/api/translations/languages': {
    desc: 'Added language',
    method: 'CREATE',
    nameFunc: ActivityFormatters.nameFunc,
  },
  'DELETE/api/translations/languages': {
    desc: 'Removed language',
    method: 'DELETE',
    nameFunc: ActivityFormatters.formatDataLanguage,
  },
  'POST/api/translations/setasdeafult': {
    desc: 'Set default language',
    nameFunc: ActivityFormatters.formatDataLanguage,
  },
  'DELETE/api/pages': { desc: 'Deleted page', method: 'DELETE', nameField: 'sharedId' },
  'DELETE/api/references': {
    desc: 'Deleted relationship',
    method: 'DELETE',
    nameField: '_id',
  },
  'DELETE/api/customisation/upload': {
    desc: 'Deleted custom file',
    method: 'DELETE',
    nameField: '_id',
  },
  'POST/api/users/new': {
    desc: 'Added new user',
    method: 'CREATE',
    nameField: 'username',
    extra: data => `with ${data.role} role`,
  },
  'POST/api/users/unlock': {
    desc: 'Unlocked account of user',
    method: 'UPDATE',
    related: 'user',
    nameField: 'username',
  },
  'POST/api/files/upload/document': {
    desc: 'Uploaded file',
    method: 'CREATE',
    related: 'entity',
    nameField: 'title',
  },
  'DELETE/api/files': { desc: 'Deleted file', method: 'DELETE', nameField: '_id' },
  'POST/api/files': {
    desc: 'Updated file',
    related: 'file',
    nameFunc: ActivityFormatters.updatedFile,
  },
  'DELETE/api/users': { desc: 'Deleted multiple users', method: 'DELETE' },
  'POST/api/usergroups': {
    desc: 'Created user group',
    method: 'CREATE',
    idField: '_id',
    nameField: 'name',
    extra: ActivityFormatters.groupMembers,
  },
  'DELETE/api/usergroups': {
    desc: 'Deleted multiple user groups',
    method: 'DELETE',
  },
  'POST/api/entities/permissions': {
    desc: 'Updated permissions on entity',
    method: 'UPDATE',
    related: 'permissions',
    nameFunc: ActivityFormatters.entitiesNames,
    extra: ActivityFormatters.loadAllowedUsersAndGroups,
  },
  'POST/api/suggestions/accept': {
    desc: 'Accepted suggestion on entity',
    method: 'UPDATE',
    related: 'suggestion',
    nameField: 'entityId',
    extra: data =>
      ` updated property: ${data.propertyName} on extractor ${data.extractorName}, ` +
      `with value: ${data.suggestedValue} . All languages: ${data.allLanguages}`,
  },
  'POST/api/suggestions/train': {
    desc: 'Information extraction training',
    method: 'CREATE',
    related: 'extractor',
    extra: data => ` extractor ${data.name} `,
  },
  'POST/api/translations/populate': {
    desc: 'Reset default translation',
    method: 'UPDATE',
    extra: data => ` locale ${data.locale} `,
  },
  'POST/api/auth2fa-enable': {
    desc: 'Two-factor authentication enabled',
    method: 'CREATE',
  },
  'POST/api/auth2fa-secret': {
    desc: 'Two-factor authentication secret',
    method: 'CREATE',
  },
  'POST/api/files/upload/custom': {
    desc: 'Uploaded custom file',
    method: 'CREATE',
    extra: data => (data.originalname ? ` originalname ${data.originalname} ` : null),
  },
};

export { CATALOG_ROUTES };
export type { RouteDescriptor };
