import { allLanguages } from 'shared/languagesList';
import { typeParsers } from 'api/activitylog/migrationsParser';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { files } from 'api/files';
import { PermissionType } from 'shared/types/permissionSchema';

export const formatLanguage = langKey => {
  const lang = allLanguages.find(({ key }) => key === langKey);
  return lang ? `${lang.label} (${lang.key})` : langKey;
};

export const formatDataLanguage = data => formatLanguage(data.key);

export const translationsName = data => {
  const [context] = data.contexts;
  return data.contexts.length === 1
    ? `in ${context.label} (${context.id})`
    : 'in multiple contexts';
};

export const nameFunc = data => `${data.label} (${data.key})`;

export const migrationLog = log => {
  const data = JSON.parse(log.body);
  return typeParsers[data.type] ? typeParsers[data.type](data) : { action: 'RAW' };
};

export const templateName = data =>
  data.templateData ? `${data.templateData.name} (${data._id})` : data._id;

export const loadEntityFromPublicForm = async data => {
  const entity = JSON.parse(data.entity);
  const templateData = await templates.getById(entity.template);
  return { ...data, templateData, title: entity.title };
};

export const loadTemplate = async data => {
  const templateData = await templates.getById(data.template || data._id);
  return { ...data, templateData };
};

export const loadEntity = async data => {
  const _id = data.entityId || data._id;
  const sharedId = data.sharedId || data.entity;
  const query = { ...(_id && { _id }), ...(sharedId && { sharedId }) };
  const [entity] = await entities.getUnrestricted(query);
  return { ...data, entity, title: entity ? entity.title : undefined };
};

export const loadFile = async data => {
  const [file] = await files.get({ _id: data._id });
  return { ...data, file, title: file ? file.originalname : `id: ${data._id}` }; // file.originalname ? file.originalname : undefined };
};

export const extraTemplate = data =>
  `of type ${
    data.templateData
      ? data.templateData.name
      : `(${data.template ? data.template.toString() : 'unassigned'})`
  }`;

export const extraAttachmentLanguage = data =>
  data.entity
    ? `of entity '${data.entity.title}' (${data.entity.sharedId}) ${formatLanguage(
        data.entity.language
      )} version`
    : null;

export const updatedFile = data => {
  let name;
  if (data.toc) {
    name = 'ToC, ';
  } else {
    name = data.pdfinfo ? 'Pdf info, ' : '';
  }
  return `${name}${data.title}`;
};

export const groupMembers = data => {
  const members = data.members.map(member => member.username).join(', ');
  return members.length > 0 ? `with members: ${members}` : 'with no members';
};

export const loadPermissionsData = async data => {
  const updateEntities = await entities.getUnrestricted(
    { sharedId: { $in: data.ids } },
    { title: 1 }
  );
  const permissionsIds = data.permissions
    .filter(p => p.type !== PermissionType.PUBLIC)
    .map(pu => pu.refId);
  const allowedUsers = await users.get({ _id: { $in: permissionsIds } }, { username: 1 });
  const allowedGroups = await userGroups.get(
    { _id: { $in: permissionsIds } },
    { name: 1, members: 1 }
  );
  const publicPermission = !!data.permissions.find(p => p.type === PermissionType.PUBLIC);

  return {
    ...data,
    entities: updateEntities,
    users: allowedUsers,
    userGroups: allowedGroups,
    public: publicPermission,
  };
};

export const entitiesNames = data => data.entities.map(e => e.title).join(', ');

function getNameOfAllowedPeople(source, field) {
  return p => {
    const people = source.find(u => u._id.toString() === p.refId);
    return `${people && people[field] ? people[field] : p.refId} - ${p.level}`;
  };
}

export const loadAllowedUsersAndGroups = data => {
  const usersPermissions = data.permissions.filter(p => p.type === PermissionType.USER);
  const groupsPermissions = data.permissions.filter(p => p.type === PermissionType.GROUP);
  const grantedUsers = usersPermissions
    .map(getNameOfAllowedPeople(data.users, 'username'))
    .join(', ');
  const grantedNames = groupsPermissions
    .map(getNameOfAllowedPeople(data.userGroups, 'name'))
    .join(', ');

  return ` with permissions for${grantedUsers.length ? ` USERS: ${grantedUsers};` : ''}${
    grantedNames.length ? ` GROUPS: ${grantedNames}` : ''
  }${data.public ? '; PUBLIC' : ''}`;
};
