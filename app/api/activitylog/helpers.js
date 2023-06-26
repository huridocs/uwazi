import { availableLanguages } from 'shared/languagesList';
import { typeParsers } from 'api/activitylog/migrationsParser';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { files } from 'api/files';
import { PermissionType } from 'shared/types/permissionSchema';
import { Suggestions } from 'api/suggestions/suggestions';
import { Extractors } from 'api/services/informationextraction/ixextractors';

const formatLanguage = langKey => {
  const lang = availableLanguages.find(({ key }) => key === langKey);
  return lang ? `${lang.label} (${lang.key})` : langKey;
};

const formatDataLanguage = data => formatLanguage(data.key);

const translationsName = data => {
  const [context] = data.contexts;
  return data.contexts.length === 1
    ? `in ${context.label} (${context.id})`
    : 'in multiple contexts';
};

const nameFunc = data => `${data.label} (${data.key})`;

const migrationLog = log => {
  const data = JSON.parse(log.body);
  return typeParsers[data.type] ? typeParsers[data.type](data) : { action: 'RAW' };
};

const templateName = data =>
  data.templateData ? `${data.templateData.name} (${data._id})` : data._id;

const loadEntityFromPublicForm = async data => {
  const entity = JSON.parse(data.entity);
  const templateData = await templates.getById(entity.template);
  return { ...data, templateData, title: entity.title };
};

const loadTemplate = async data => {
  const templateData = await templates.getById(data.template || data._id);
  return { ...data, templateData };
};

const loadEntity = async data => {
  const _id = data.entityId || data._id;
  const sharedId = data.sharedId || data.entity;
  const query = { ...(_id && { _id }), ...(sharedId && { sharedId }) };
  const [entity] = await entities.getUnrestricted(query);
  return { ...data, entity, title: entity ? entity.title : undefined };
};

const loadFile = async data => {
  const [file] = await files.get({ _id: data._id });
  return { ...data, file, title: file ? file.originalname : `id: ${data._id}` };
};

const extraTemplate = data =>
  `of type ${
    data.templateData
      ? data.templateData.name
      : `(${data.template ? data.template.toString() : 'unassigned'})`
  }`;

const extraAttachmentLanguage = data =>
  data.entity
    ? `of entity '${data.entity.title}' (${data.entity.sharedId}) ${formatLanguage(
        data.entity.language
      )} version`
    : null;

const updatedFile = data => {
  let name;
  if (data.toc) {
    name = 'ToC, ';
  } else {
    name = '';
  }
  return `${name}${data.title}`;
};

const groupMembers = data => {
  const members = data.members.map(member => member.username).join(', ');
  return members.length > 0 ? `with members: ${members}` : 'with no members';
};

const loadPermissionsData = async data => {
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

const entitiesNames = data => data.entities.map(e => e.title).join(', ');

function getNameOfAllowedPeople(source, field) {
  return p => {
    const people = source.find(u => u._id.toString() === p.refId);
    return `${people && people[field] ? people[field] : p.refId} - ${p.level}`;
  };
}

const loadAllowedUsersAndGroups = data => {
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

const loadSuggestionData = async data => {
  const suggestion = await Suggestions.getById(data.suggestion._id);
  const entity = await entities.getById(data.suggestion.entityId);
  const [extractor] = await Extractors.get({ _id: suggestion.extractorId });
  return { ...data, ...suggestion, title: entity?.title, extractorName: extractor.name };
};

const loadExtractorData = async data => {
  const [extractor] = await Extractors.get({ _id: data.extractorId });
  return { ...data, ...extractor };
};

const loadUser = async data => {
  let [user] = await users.get({ _id: data._id });
  user = user || { username: data._id.toString() };
  return { ...data, ...user };
};

export {
  translationsName,
  formatLanguage,
  formatDataLanguage,
  nameFunc,
  migrationLog,
  templateName,
  loadEntityFromPublicForm,
  loadTemplate,
  loadEntity,
  loadFile,
  extraTemplate,
  extraAttachmentLanguage,
  updatedFile,
  groupMembers,
  loadPermissionsData,
  entitiesNames,
  loadAllowedUsersAndGroups,
  loadSuggestionData,
  loadExtractorData,
  loadUser,
};
