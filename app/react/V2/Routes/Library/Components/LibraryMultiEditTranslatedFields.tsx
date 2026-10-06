import React from 'react';
import type { Property } from '#app/apiResponseTypes.js';
import { LibraryMultiEditTranslatedControl } from './LibraryMultiEditTranslatedControl.js';
import type { EditLanguage } from './useEditLanguages.js';

type LibraryMultiEditTranslatedFieldsProps = {
  property: Property;
  languages: EditLanguage[];
  activeLanguage: string;
  context: string;
  disabled: boolean;
};

const LibraryMultiEditTranslatedFields = ({
  property,
  languages,
  activeLanguage,
  context,
  disabled,
}: LibraryMultiEditTranslatedFieldsProps) => (
  <div className="flex flex-col gap-3">
    {languages.map(language => (
      <LibraryMultiEditTranslatedControl
        key={`${property.name}-${language.key}`}
        property={property}
        language={language}
        activeLanguage={activeLanguage}
        context={context}
        disabled={disabled}
      />
    ))}
  </div>
);

export type { LibraryMultiEditTranslatedFieldsProps };
export { LibraryMultiEditTranslatedFields };
