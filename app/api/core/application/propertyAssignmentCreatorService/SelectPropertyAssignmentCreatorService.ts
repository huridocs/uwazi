import { PropertyAssignment, SelectionEntry } from '#api/core/domain/template/PropertyValue.js';
import { SelectProperty } from '#api/core/domain/template/select/SelectProperty.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { ThesaurusValue } from '#api/core/domain/thesaurus/Thesaurus.js';
import { TranslationCollection } from '#api/i18n.v2/model/TranslationCollection.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService.js';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource.js';

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  thesauriDS: ThesauriDataSource;
};

export class SelectPropertyAssignmentCreatorService implements PropertyAssignmentCreatorService {
  constructor(private deps: Deps) {}

  // eslint-disable-next-line max-statements
  async create({
    propertyAssignment,
    template,
  }: CreatePropertyAssignmentInput<{ value: string }>): Promise<PropertyAssignment[]> {
    const property = template
      .getPropertyByName<SelectProperty>(propertyAssignment.name)
      .getDataOrThrow();

    const thesaurus = (await this.deps.thesauriDS.getById(property.content)).getDataOrThrow();

    const existingThesaurusValues: ThesaurusValue[] = [];

    propertyAssignment.value.forEach(({ value }) => {
      const thesaurusValue = thesaurus.getValueById(value);
      if (!thesaurusValue) return;

      existingThesaurusValues.push(thesaurusValue);
    });

    const translations = await this.deps.translationsDS.getByContext(thesaurus.id).all();
    const translationCollection = new TranslationCollection(translations);

    const languages = await this.deps.settingsDS.getLanguageKeys();

    const propertyAssignments: PropertyAssignment[] = [];

    languages.forEach(language => {
      const value: SelectionEntry[] = existingThesaurusValues.map(thesaurusValue => {
        const label = translationCollection.getTranslation(language, thesaurusValue.label);

        const group = thesaurus.getGroupByThesaurusValueId(thesaurusValue.id);
        const parent = group
          ? {
              value: group.id,
              label: translationCollection.getTranslation(language, group.label),
            }
          : undefined;

        return {
          value: thesaurusValue.id,
          label,
          ...(parent ? { parent } : {}),
        };
      });

      propertyAssignments.push(
        template.createPropertyAssignment(property.name, { value, language }, true)
      );
    });

    return propertyAssignments;
  }
}
