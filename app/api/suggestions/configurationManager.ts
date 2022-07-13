import entities from 'api/entities';
import entitiesModel from 'api/entities/entitiesModel';
import { files } from 'api/files/files';
import settings from 'api/settings/settings';
import languages from 'shared/languages';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { IXSuggestionsModel } from './IXSuggestionsModel';
import { Suggestions } from './suggestions';

interface ISettingsTemplate {
  template: string | ObjectIdSchema;
  properties: string[];
}

const deleteSuggestionsNotConfigured = async (
  currentSettingsTemplates: any[],
  settingsTemplates: any[]
) => {
  const deletedTemplates = currentSettingsTemplates.filter(
    set => !settingsTemplates.find((st: any) => st.template === set.template)
  );

  const deletedTemplateProps = currentSettingsTemplates
    .map(currentTemplate => {
      const currentTemplateId = currentTemplate.template;
      const property: any = {};
      const template = settingsTemplates.find((st: any) => st.template === currentTemplateId);
      if (template) {
        property.template = currentTemplateId;
        property.properties = [];
        currentTemplate.properties.forEach((prop: string) => {
          if (!template.properties.includes(prop)) {
            property.properties.push(prop);
          }
        });
      }
      return property;
    })
    .filter(prop => prop.template && prop.properties.length);

  const deletedTemplatesAndDeletedTemplateProps = deletedTemplates.concat(deletedTemplateProps);

  if (deletedTemplatesAndDeletedTemplateProps.length > 0) {
    const deletedTemplateIds = deletedTemplatesAndDeletedTemplateProps.map(temps => temps.template);

    const entitiesDoc = await entities.get({ template: { $in: deletedTemplateIds } }, 'sharedId');

    const entitiesSharedIds = entitiesDoc.map((entity: any) => entity.sharedId);
    const propNames: string[] = deletedTemplatesAndDeletedTemplateProps.reduce(
      (acc, curr) => [...acc, ...curr.properties],
      []
    );
    const uniquePropNames: string[] = [...new Set<string>(propNames)];

    await IXSuggestionsModel.db.deleteMany({
      $and: [{ entityId: { $in: entitiesSharedIds } }, { propertyName: { $in: uniquePropNames } }],
    });
  }
};

const getTemplatesWithNewProps = (
  settingsTemplates: ISettingsTemplate[],
  currentSettingsTemplates: ISettingsTemplate[]
) =>
  settingsTemplates
    .map(newTemp => {
      const oldTemplate = currentSettingsTemplates?.find(
        oldTemp => oldTemp.template === newTemp.template
      );
      if (newTemp.properties.length === oldTemplate?.properties.length || !oldTemplate) {
        return null;
      }
      const newProps = newTemp.properties;
      const oldProps = oldTemplate?.properties || [];
      const addedProps: string[] = newProps
        .map((prop: any) => (!oldProps.includes(prop) ? prop : false))
        .filter(p => p);
      return { ...newTemp, properties: addedProps };
    })
    .filter(t => t);

const getTemplateDifference = (
  currentSettingsTemplates: ISettingsTemplate[],
  settingsTemplates: ISettingsTemplate[]
) => {
  const newTemplates = settingsTemplates.filter(temp => {
    const oldTemplateIds = currentSettingsTemplates?.map(oldTemp => oldTemp.template) || [];
    return !oldTemplateIds.includes(temp.template);
  });

  const combedNewTemplates = getTemplatesWithNewProps(settingsTemplates, currentSettingsTemplates);

  return newTemplates.concat(combedNewTemplates as ISettingsTemplate[]);
};

const fetchEntitiesBatch = async (query: any, limit: number = 100) =>
  entitiesModel.db.find(query).select('sharedId').limit(limit).sort({ _id: 1 }).exec();

const fetchEntitiesSharedIds = async (
  template: ISettingsTemplate['template'],
  defaultLanguage: string,
  batchSize = 2000
) => {
  const BATCH_SIZE = batchSize;
  let query: any = {
    template,
    language: defaultLanguage,
  };

  let sharedIds: string[] = [];

  let fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
  while (fetchedEntities.length) {
    sharedIds = sharedIds.concat(fetchedEntities.map(e => e.sharedId!));
    query = {
      ...query,
      _id: { $gt: fetchedEntities[fetchedEntities.length - 1]._id },
    };
    // eslint-disable-next-line no-await-in-loop
    fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
  }

  return sharedIds;
};

const createDefaultSuggestionsForFiles = async (
  fileList: FileType[],
  template: ISettingsTemplate,
  defaultLanguage: string
) => {
  const blankSuggestions: IXSuggestionType[] = [];
  fileList.forEach((file: FileType) => {
    const language = file.language
      ? languages.get(file.language, 'ISO639_1') || defaultLanguage
      : defaultLanguage;
    template.properties.forEach((propertyName: string) => {
      if (file.entity) {
        blankSuggestions.push({
          language,
          fileId: file._id,
          entityId: file.entity,
          propertyName,
          status: 'ready',
          error: '',
          segment: '',
          suggestedValue: '',
          date: new Date().getTime(),
        });
      }
    });
  });

  await Suggestions.saveMultiple(blankSuggestions);
};

const createDefaultSuggestions = async (
  settingsTemplates: ISettingsTemplate[],
  defaultLanguage: string,
  batchSize?: number
) => {
  const templatesPromises = settingsTemplates.map(async template => {
    const entitiesSharedIds = await fetchEntitiesSharedIds(
      template.template,
      defaultLanguage,
      batchSize
    );

    const fetchedFiles = await files.get(
      { entity: { $in: entitiesSharedIds }, type: 'document' },
      '_id entity language extractedMetadata'
    );

    await createDefaultSuggestionsForFiles(fetchedFiles, template, defaultLanguage);
  });
  await Promise.all(templatesPromises);
};

const saveConfigurations = async (settingsTemplates: ISettingsTemplate[]) => {
  const currentSettings = await settings.get();
  const defaultLanguage = currentSettings?.languages?.find(lang => lang.default)?.key;
  let currentSettingsTemplates: ISettingsTemplate[] | undefined =
    currentSettings.features?.metadataExtraction?.templates;
  currentSettingsTemplates = currentSettingsTemplates || [];

  await deleteSuggestionsNotConfigured(currentSettingsTemplates, settingsTemplates);
  // @ts-ignore
  currentSettings.features.metadataExtraction.templates = settingsTemplates;
  await settings.save(currentSettings);

  const newTemplates = getTemplateDifference(currentSettingsTemplates, settingsTemplates);
  await createDefaultSuggestions(newTemplates, defaultLanguage as string);

  return currentSettings;
};

export type { ISettingsTemplate };
export { createDefaultSuggestions, createDefaultSuggestionsForFiles, saveConfigurations };
