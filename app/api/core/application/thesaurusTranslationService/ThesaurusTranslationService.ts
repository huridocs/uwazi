import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { ThesaurusDiff } from '#api/core/domain/thesaurus/ThesaurusDiff.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource.js';

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
};

type LabelChanges = {
  labelsToBeRemoved: Set<string>;
  labelsToBeAdded: Set<string>;
  labelsToBeUpdated: { [from: string]: string };
};

function emptyLabelChanges(): LabelChanges {
  return {
    labelsToBeRemoved: new Set<string>(),
    labelsToBeAdded: new Set<string>(),
    labelsToBeUpdated: {},
  };
}

function mergeLabelChanges(left: LabelChanges, right: LabelChanges): LabelChanges {
  return {
    labelsToBeRemoved: new Set([...left.labelsToBeRemoved, ...right.labelsToBeRemoved]),
    labelsToBeAdded: new Set([...left.labelsToBeAdded, ...right.labelsToBeAdded]),
    labelsToBeUpdated: { ...left.labelsToBeUpdated, ...right.labelsToBeUpdated },
  };
}

function labelExistsInOtherValues(thesaurus: Thesaurus, label: string, excludeId: string) {
  return thesaurus.values.some(value => {
    if (value.label === label && value.id !== excludeId) return true;

    if (value.values) {
      return value.values.some(nested => nested.label === label && nested.id !== excludeId);
    }

    return false;
  });
}

function createLabelsFromThesaurusValues(thesaurusValues: Thesaurus['values']) {
  const labels = new Set<string>();

  thesaurusValues.forEach(value => {
    labels.add(value.label);
    value.values?.forEach(nestedValue => {
      labels.add(nestedValue.label);
    });
  });

  return labels;
}

function collectRemovedLabels(diff: ThesaurusDiff): LabelChanges {
  const changes = emptyLabelChanges();
  diff.removedValues.forEach(value => {
    if (!diff.after.getValueByLabel(value.label)) {
      changes.labelsToBeRemoved.add(value.label);
    }
  });
  return changes;
}

function collectAddedLabels(diff: ThesaurusDiff): LabelChanges {
  const changes = emptyLabelChanges();
  diff.addedValues.forEach(value => {
    if (!diff.before.getValueByLabel(value.label)) {
      changes.labelsToBeAdded.add(value.label);
    }
  });
  return changes;
}

function resolveUpdatedLabelChange(
  beforeLabel: string,
  afterLabel: string,
  oldLabelExistsInOtherValues: boolean,
  newLabelExistedInOtherValues: boolean
): LabelChanges {
  if (!oldLabelExistsInOtherValues && !newLabelExistedInOtherValues) {
    return {
      ...emptyLabelChanges(),
      labelsToBeUpdated: { [beforeLabel]: afterLabel },
    };
  }

  const changes = emptyLabelChanges();
  if (!oldLabelExistsInOtherValues && newLabelExistedInOtherValues) {
    changes.labelsToBeRemoved.add(beforeLabel);
  }
  if (oldLabelExistsInOtherValues && !newLabelExistedInOtherValues) {
    changes.labelsToBeAdded.add(afterLabel);
  }
  return changes;
}

function labelChangeForUpdatedValue(
  diff: ThesaurusDiff,
  value: Thesaurus['values'][number]
): LabelChanges {
  const beforeValue = diff.before.getValueById(value.id)!;
  if (beforeValue.label === value.label) {
    return emptyLabelChanges();
  }

  return resolveUpdatedLabelChange(
    beforeValue.label,
    value.label,
    labelExistsInOtherValues(diff.after, beforeValue.label, value.id),
    labelExistsInOtherValues(diff.before, value.label, value.id)
  );
}

function collectUpdatedLabelChanges(diff: ThesaurusDiff): LabelChanges {
  return diff.updatedValues.reduce(
    (memo, value) => mergeLabelChanges(memo, labelChangeForUpdatedValue(diff, value)),
    emptyLabelChanges()
  );
}

function collectLabelChanges(diff: ThesaurusDiff): LabelChanges {
  let changes = emptyLabelChanges();

  if (diff.removedValues.length) {
    changes = mergeLabelChanges(changes, collectRemovedLabels(diff));
  }
  if (diff.addedValues.length) {
    changes = mergeLabelChanges(changes, collectAddedLabels(diff));
  }
  if (diff.updatedValues.length) {
    changes = mergeLabelChanges(changes, collectUpdatedLabelChanges(diff));
  }
  if (diff.updatedName) {
    changes = mergeLabelChanges(changes, {
      ...emptyLabelChanges(),
      labelsToBeUpdated: { [diff.before.name]: diff.after.name },
    });
  }

  return changes;
}

function toContextMutation(changes: LabelChanges, contextLabelChanged: boolean) {
  const valueChanges: Record<string, string> = {};
  changes.labelsToBeAdded.forEach(label => {
    valueChanges[label] = label;
  });
  Object.values(changes.labelsToBeUpdated).forEach(newKey => {
    valueChanges[newKey] = newKey;
  });

  return {
    keyChanges: changes.labelsToBeUpdated,
    valueChanges,
    keysToDelete: Array.from(changes.labelsToBeRemoved),
    hasChanges:
      contextLabelChanged ||
      changes.labelsToBeRemoved.size > 0 ||
      Object.keys(changes.labelsToBeUpdated).length > 0 ||
      Object.keys(valueChanges).length > 0,
  };
}

class ThesaurusTranslationService {
  constructor(private deps: Deps) {}

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
    const labels = createLabelsFromThesaurusValues(thesaurus.values);
    labels.add(thesaurus.name);

    const translations = await this.createTranslations(thesaurus.id, thesaurus.name, labels);
    await this.deps.translationsDS.insert(translations);
  }

  private async persistLabelChanges(diff: ThesaurusDiff, changes: LabelChanges) {
    const mutation = toContextMutation(changes, Boolean(diff.updatedName));
    if (!mutation.hasChanges) {
      return;
    }

    const languages = await this.deps.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
    const translationContext = await this.deps.translationsDS.getContext(
      {
        type: 'Thesaurus',
        label: diff.after.name,
        id: diff.id,
      },
      languages,
      defaultLanguage
    );

    translationContext.applyChanges(
      mutation.keyChanges,
      mutation.valueChanges,
      mutation.keysToDelete
    );
    await this.deps.translationsDS.updateContext(translationContext);
  }

  async update(diff: ThesaurusDiff) {
    const changes = collectLabelChanges(diff);
    await this.persistLabelChanges(diff, changes);
  }
}

export { ThesaurusTranslationService };
