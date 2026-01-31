import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { ThesaurusDiff } from '#api/core/domain/thesaurus/ThesaurusDiff.js';

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
};

class ThesaurusTranslationService {
  constructor(private deps: Deps) {}

  private labelExistsInOtherValues(thesaurus: Thesaurus, label: string, excludeId: string) {
    return thesaurus.values.some(value => {
      if (value.label === label && value.id !== excludeId) return true;

      if (value.values) {
        return value.values.some(nested => nested.label === label && nested.id !== excludeId);
      }

      return false;
    });
  }

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
    const labelsToBeRemoved = new Set<string>();
    const labelsToBeAdded = new Set<string>();
    const labelsToBeUpdated: { [from: string]: string } = {};

    if (diff.removedValues.length) {
      diff.removedValues.forEach(value => {
        const stillExisting = diff.after.getValueByLabel(value.label);

        if (!stillExisting) {
          labelsToBeRemoved.add(value.label);
        }
      });
    }

    if (diff.addedValues.length) {
      diff.addedValues.forEach(value => {
        const alreadyExists = diff.before.getValueByLabel(value.label);

        if (!alreadyExists) {
          labelsToBeAdded.add(value.label);
        }
      });
    }

    if (diff.updatedValues.length) {
      diff.updatedValues.forEach(value => {
        const beforeValue = diff.before.getValueById(value.id)!;
        const labelChanged = beforeValue.label !== value.label;

        if (!labelChanged) return;

        const oldLabelExistsInOtherValues = this.labelExistsInOtherValues(
          diff.after,
          beforeValue.label,
          value.id
        );

        const newLabelExistedInOtherValues = this.labelExistsInOtherValues(
          diff.before,
          value.label,
          value.id
        );

        const isSimpleRename = !oldLabelExistsInOtherValues && !newLabelExistedInOtherValues;
        const shouldRemoveOldLabel = !oldLabelExistsInOtherValues && newLabelExistedInOtherValues;
        const shouldAddNewLabel = oldLabelExistsInOtherValues && !newLabelExistedInOtherValues;

        if (isSimpleRename) {
          labelsToBeUpdated[beforeValue.label] = value.label;
        }

        if (shouldRemoveOldLabel) {
          labelsToBeRemoved.add(beforeValue.label);
        }

        if (shouldAddNewLabel) {
          labelsToBeAdded.add(value.label);
        }
      });
    }

    if (labelsToBeRemoved.size) {
      await this.deps.translationsDS.deleteKeysByContext(diff.id, Array.from(labelsToBeRemoved));
    }

    if (labelsToBeAdded.size) {
      const translations = await this.createTranslations(diff.id, diff.name, labelsToBeAdded);

      await this.deps.translationsDS.insert(translations);
    }

    if (diff.updatedName) {
      labelsToBeUpdated[diff.before.name] = diff.after.name;
    }

    if (Object.keys(labelsToBeUpdated).length > 0) {
      const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

      await this.deps.translationsDS.updateKeysByContextV2({
        contextId: diff.id,
        keyChanges: labelsToBeUpdated,
        defaultLanguage,
      });
    }

    if (diff.updatedName) {
      await this.deps.translationsDS.updateContextLabel(diff.id, diff.after.name);
    }
  }
}

export { ThesaurusTranslationService };
