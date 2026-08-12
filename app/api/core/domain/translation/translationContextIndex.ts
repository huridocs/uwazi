import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Translation } from './Translation.js';

export type TranslationIndex = Map<string, Map<LanguageISO6391, Translation>>;

export function buildTranslationIndex(translations: Translation[]): TranslationIndex {
  const index: TranslationIndex = new Map();

  translations.forEach(translation => {
    const langMap = index.get(translation.key) ?? new Map<LanguageISO6391, Translation>();
    langMap.set(translation.language, translation);
    index.set(translation.key, langMap);
  });

  return index;
}

export function cloneTranslationIndex(index: TranslationIndex): TranslationIndex {
  const cloned: TranslationIndex = new Map();

  index.forEach((langMap, key) => {
    cloned.set(key, new Map(langMap));
  });

  return cloned;
}

export function deduplicateKeyChanges(
  translations: TranslationIndex,
  keyChanges: { [oldKey: string]: string },
  valueChanges: { [key: string]: string }
): {
  deduplicatedKeyChanges: { [oldKey: string]: string };
  keysWithMultipleToOneRename: string[];
} {
  const deduplicated: { [oldKey: string]: string } = {};
  const keysCreatedDuringRename = new Set<string>();
  const multipleToOneKeys = new Set<string>();

  Object.entries(keyChanges).forEach(([oldKey, newKey]) => {
    const targetExists = translations.has(newKey) || keysCreatedDuringRename.has(newKey);
    const isNoOp = oldKey === newKey;
    const oldKeyStillNeeded = !!valueChanges[oldKey];

    if ((!targetExists || isNoOp) && !oldKeyStillNeeded) {
      deduplicated[oldKey] = newKey;
      keysCreatedDuringRename.add(newKey);
    } else if (targetExists && !isNoOp && keysCreatedDuringRename.has(newKey)) {
      multipleToOneKeys.add(newKey);
    }
  });

  return {
    deduplicatedKeyChanges: deduplicated,
    keysWithMultipleToOneRename: Array.from(multipleToOneKeys),
  };
}

export function calculateKeysToRemove(
  originalKeyChanges: { [oldKey: string]: string },
  keysToDelete: string[],
  valueChanges: { [key: string]: string }
): string[] {
  const keysToRemoveSet = new Set<string>(keysToDelete);

  Object.entries(originalKeyChanges).forEach(([oldKey, newKey]) => {
    if (oldKey !== newKey) {
      keysToRemoveSet.add(oldKey);
    }
  });

  return Array.from(keysToRemoveSet).filter(key => !valueChanges[key]);
}
