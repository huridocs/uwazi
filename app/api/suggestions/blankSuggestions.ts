import { files } from 'api/files';
import { EnforcedWithId } from 'api/odm';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/getFiles';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import templates from 'api/templates';
import { LanguageUtils } from 'shared/language';
import { fetchEntitiesData } from './batchProcessing';
import { Suggestions } from './suggestions';
import { IXSuggestionsModel } from './IXSuggestionsModel';

const getBlankSuggestionForProperty = ({
  entityId,
  extractorId,
  propertyName,
  propertyType,
  template,
  language,
}: {
  entityId: string;
  extractorId: ObjectIdSchema;
  propertyName: string;
  propertyType: string;
  template: ObjectIdSchema;
  language: string;
}) => ({
  language,
  entityId,
  entityTemplate: template.toString(),
  extractorId,
  propertyName,
  status: 'ready' as 'ready',
  error: '',
  segment: '',
  suggestedValue: propertyTypeIsMultiValued(propertyType) ? [] : '',
  date: new Date().getTime(),
});

const getBlankSuggestionForPdf = ({
  extractorId,
  propertyName,
  template,
  propertyType,
  defaultLanguage,
  file,
}: {
  extractorId: ObjectIdSchema;
  propertyName: string;
  template: ObjectIdSchema;
  propertyType: string;
  defaultLanguage: string;
  file: EnforcedWithId<FileType>;
}) => ({
  language: file.language
    ? LanguageUtils.fromISO639_3(file.language, false)?.ISO639_1 || defaultLanguage
    : defaultLanguage,
  fileId: file._id,
  entityId: file.entity!,
  entityTemplate: template.toString(),
  extractorId,
  propertyName,
  status: 'ready' as 'ready',
  error: '',
  segment: '',
  suggestedValue: propertyTypeIsMultiValued(propertyType) ? [] : '',
  date: new Date().getTime(),
});

const createBlankSuggestionsForPartialExtractor = async (
  extractor: IXExtractorType,
  selectedTemplates: ObjectIdSchema[]
) => {
  const defaultLanguage = (await settings.getDefaultLanguage()).key;
  const extractorTemplates = new Set(extractor.templates.map(t => t.toString()));
  const sampleProperty = await templates.getPropertyByName(extractor.property);

  const filteredTemplates = selectedTemplates.filter(template =>
    extractorTemplates.has(template.toString())
  );

  await filteredTemplates.reduce(async (promise, template) => {
    await promise;

    if (extractor.source.pdf) {
      await fetchEntitiesData(template, async batchData => {
        const fetchedFiles = await files.get(
          {
            entity: { $in: batchData.map(entity => entity.sharedId) },
            type: 'document',
          },
          '_id entity language extractedMetadata'
        );

        const batchSuggestions = fetchedFiles
          .filter(file => file.entity)
          .map(file =>
            getBlankSuggestionForPdf({
              file,
              extractorId: extractor._id,
              template,
              propertyName: extractor.property,
              propertyType: sampleProperty.type,
              defaultLanguage,
            })
          );

        await Suggestions.saveMultiple(batchSuggestions);
      });
    } else if (tenants.current().featureFlags?.ixExtraSources && extractor.source.property) {
      await fetchEntitiesData(
        template,
        async (batchData: { sharedId: string; language: string }[]) => {
          const now = new Date().getTime();
          const templateString = template.toString();
          const isMultiValued = propertyTypeIsMultiValued(sampleProperty.type);

          // Pre-compute common values to avoid repeated operations in the map
          const batchSuggestions = batchData.map(entity => ({
            language: entity.language,
            entityId: entity.sharedId,
            entityTemplate: templateString,
            extractorId: extractor._id,
            propertyName: extractor.property,
            status: 'ready' as 'ready',
            error: '',
            segment: '',
            suggestedValue: isMultiValued ? [] : '',
            date: now,
          }));

          // Process in chunks of 1000 for better memory management 
          const chunkSize = 1000;
          const chunks = [];
          for (let i = 0; i < batchSuggestions.length; i += chunkSize) {
            chunks.push(batchSuggestions.slice(i, i + chunkSize));
          }

          // Save chunks in parallel
          await Promise.all(chunks.map(chunk => IXSuggestionsModel.saveMultiple(chunk)));
        }
      );
    }

    return Promise.resolve();
  }, Promise.resolve());
};

const createBlankSuggestionsForExtractor = async (extractor: IXExtractorType) =>
  createBlankSuggestionsForPartialExtractor(extractor, extractor.templates);

export {
  createBlankSuggestionsForExtractor,
  createBlankSuggestionsForPartialExtractor,
  getBlankSuggestionForPdf,
  getBlankSuggestionForProperty,
};
