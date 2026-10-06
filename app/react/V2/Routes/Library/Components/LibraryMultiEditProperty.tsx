import React from 'react';
import type { ClientThesaurus, Property } from '#app/apiResponseTypes.js';
import { isTranslatableProperty } from './translatableProperty.js';
import { LibraryMultiEditSharedField } from './LibraryMultiEditSharedField.js';
import { LibraryMultiEditTranslatedFields } from './LibraryMultiEditTranslatedFields.js';
import type { EditLanguage } from './useEditLanguages.js';

type LibraryMultiEditPropertyProps = {
  property: Property;
  languages: EditLanguage[];
  activeLanguage: string;
  context: string;
  disabled: boolean;
  thesauri: ClientThesaurus[];
};

const LibraryMultiEditProperty = ({
  property,
  languages,
  activeLanguage,
  context,
  disabled,
  thesauri,
}: LibraryMultiEditPropertyProps) => {
  if (property.type === 'preview') return null;

  if (isTranslatableProperty(property.type)) {
    return (
      <LibraryMultiEditTranslatedFields
        property={property}
        languages={languages}
        activeLanguage={activeLanguage}
        context={context}
        disabled={disabled}
      />
    );
  }

  return (
    <LibraryMultiEditSharedField
      property={property}
      context={context}
      disabled={disabled}
      thesauri={thesauri}
    />
  );
};

export type { LibraryMultiEditPropertyProps };
export { LibraryMultiEditProperty };
