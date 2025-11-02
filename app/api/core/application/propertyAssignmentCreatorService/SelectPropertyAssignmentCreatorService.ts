import { PropertyAssignment, SelectionEntry } from 'api/core/domain/template/PropertyValue';
import { SelectProperty } from 'api/core/domain/template/select/SelectProperty';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ThesauriDataSource } from '../propertyCreatorService/SelectPropertyCreatorService';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from './PropertyAssignmentCreatorService';

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

    const valueIdToLabel = new Map<string, string>();
    const valueIdToParent: Map<string, { id: string; label: string }> = new Map();

    thesaurus?.values?.forEach(v => {
      if (v.values && v.values.length) {
        v.values.forEach(child => {
          if (child.id) {
            valueIdToLabel.set(child.id, child.label);
            if (v.id) {
              valueIdToParent.set(child.id, { id: v.id, label: v.label });
            }
          }
        });
      } else if (v.id) {
        valueIdToLabel.set(v.id, v.label);
      }
    });

    const enrichedValues = propertyAssignment.value.map(({ value }) => {
      if (!value.length) {
        return { key: '', value: '' };
      }

      const key = valueIdToLabel.get(value);
      if (!key) {
        throw new Error(
          `The value "${value}" does not exist in the referenced Thesaurus "${thesaurus.name}"`
        );
      }
      return { key, value };
    });

    const translations = await this.deps.translationsDS
      .getByContext(thesaurus._id!.toString())
      .all();

    const translationsByLang = new Map<LanguageISO6391, Map<string, string>>();

    translations.forEach(t => {
      const byKey = translationsByLang.get(t.language) || new Map<string, string>();
      byKey.set(t.key, t.value);
      translationsByLang.set(t.language, byKey);
    });

    const languages = await this.deps.settingsDS.getLanguageKeys();

    const propertyAssignments: PropertyAssignment[] = [];

    languages.forEach(language => {
      const byKey = translationsByLang.get(language) || new Map<string, string>();

      const value: SelectionEntry[] = enrichedValues.map(ev => {
        const baseLabel = ev.key;
        const label = byKey.get(baseLabel) || baseLabel;

        const parentInfo = valueIdToParent.get(ev.value);
        const parent = parentInfo
          ? {
              value: parentInfo.id,
              label: byKey.get(parentInfo.label) || parentInfo.label,
            }
          : undefined;

        return {
          value: ev.value,
          label,
          ...(parent ? { parent } : {}),
        };
      });

      propertyAssignments.push(
        template.createPropertyAssignment(property.name, { value, language })
      );
    });

    return propertyAssignments;
  }
}
