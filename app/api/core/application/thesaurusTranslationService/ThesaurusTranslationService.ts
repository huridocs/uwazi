/* eslint-disable max-statements */
import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { Translation } from 'api/i18n.v2/model/Translation';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { ThesaurusDiff } from 'api/core/domain/thesaurus/ThesaurusDiff';
import { SettingsDataSource } from '../contracts/SettingsDataSource';

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
};

class ThesaurusTranslationService {
  constructor(private deps: Deps) {}

  private createLabelsFromThesaurusValues(thesaurusValues: Thesaurus['values']) {
    const labels = new Set<string>();

    thesaurusValues.forEach(value => {
      labels.add(value.label);
      value.values?.forEach(nestedValue => {
        labels.add(nestedValue.label);
      });
    });

    return labels;
  }

  private async createTranslations(id: string, name: string, labels: Set<string>) {
    const installedLanguages = await this.deps.settingsDS.getInstalledLanguages();

    const context = {
      type: 'Thesaurus' as const,
      label: name,
      id,
    };

    const translations: Translation[] = [];

    installedLanguages.forEach(language => {
      labels.forEach(label => {
        translations.push(new Translation(label, label, language.key, context));
      });
    });

    return translations;
  }

  async create(thesaurus: Thesaurus) {
    const labels = this.createLabelsFromThesaurusValues(thesaurus.values);
    labels.add(thesaurus.name);

    const translations = await this.createTranslations(thesaurus.id, thesaurus.name, labels);

    await this.deps.translationsDS.insert(translations);
  }

  async update(diff: ThesaurusDiff) {
    if (diff.removedValues.length) {
      await this.deps.translationsDS.deleteKeysByContext(
        diff.id,
        diff.removedValues.map(v => v.label)
      );
    }

    if (diff.addedValues.length) {
      const labels = this.createLabelsFromThesaurusValues(diff.addedValues);

      const translations = await this.createTranslations(diff.id, diff.name, labels);

      await this.deps.translationsDS.insert(translations);
    }

    let changes: { [from: string]: string } = {};

    if (diff.updatedValues.length) {
      changes = diff.updatedValues.reduce(
        (acc, value) => {
          const beforeValue = diff.before.getValueById(value.id);
          if (beforeValue) {
            acc[beforeValue.label] = value.label;
          }

          return acc;
        },
        {} as { [from: string]: string }
      );
    }

    if (diff.updatedName) {
      changes[diff.before.name] = diff.after.name;
    }

    if (Object.keys(changes).length > 0) {
      const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

      await this.deps.translationsDS.updateKeysByContextV2({
        contextId: diff.id,
        keyChanges: changes,
        defaultLanguage,
      });
    }

    if (diff.updatedName) {
      await this.deps.translationsDS.updateContextLabel(diff.id, diff.after.name);
    }
  }
}

export { ThesaurusTranslationService };
