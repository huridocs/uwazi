import { t } from '#app/I18N/index.js';
import { availableLanguages } from '#shared/language/index.js';
import { OptionSchema } from '#V2/Components/Forms/index.js';

const fileLanguageSelectOptions = (): OptionSchema[] => [
  ...availableLanguages.map(item => ({
    key: item.ISO639_3,
    value: item.ISO639_3,
    label: `${item.localized_label} (${item.label})`,
  })),
  { key: 'other', value: 'other', label: t('System', 'other', 'other', false) },
];

export { fileLanguageSelectOptions };
