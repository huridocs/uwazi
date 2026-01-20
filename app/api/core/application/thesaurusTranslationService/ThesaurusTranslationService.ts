import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
};

class ThesaurusTranslationService {
  constructor(private deps: Deps) {}

  async create(thesaurus: Thesaurus) {
    const installedLanguages = await this.deps.settingsDS.getInstalledLanguages();

    const context = {
      type: 'Thesaurus' as const,
      label: thesaurus.name,
      id: thesaurus.id,
    };

    const labels = new Set<string>();
    labels.add(thesaurus.name);

    thesaurus.values.forEach(value => {
      labels.add(value.label);
      value.values?.forEach(nestedValue => {
        labels.add(nestedValue.label);
      });
    });

    const translations: Translation[] = [];

    installedLanguages.forEach(language => {
      labels.forEach(label => {
        translations.push(new Translation(label, label, language.key, context));
      });
    });

    await this.deps.translationsDS.insert(translations);
  }
}

export { ThesaurusTranslationService };
