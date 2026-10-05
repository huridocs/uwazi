import React from 'react';
import type { Property } from '#app/apiResponseTypes.js';
import {
  LinkField,
  MarkdownField,
  MediaField,
  TextField,
} from '#V2/Components/Metadata/EntityEditor/Components/index.js';
import { fieldPath } from './multiEditFieldPath.js';
import type { EditLanguage } from './useEditLanguages.js';

type LibraryMultiEditTranslatedControlProps = {
  property: Property;
  language: EditLanguage;
  activeLanguage: string;
  context: string;
  disabled: boolean;
};

const imageStyle = (style?: string): 'contain' | 'cover' | 'fill' =>
  style === 'contain' || style === 'cover' ? style : 'fill';

const LibraryMultiEditTranslatedControl = ({
  property,
  language,
  activeLanguage,
  context,
  disabled,
}: LibraryMultiEditTranslatedControlProps) => {
  const path = fieldPath(property, language.key, activeLanguage);
  const label = `${property.label} (${language.label})`;
  const { type } = property;

  if (type === 'markdown') {
    return <MarkdownField context={context} label={label} field={path} disabled={disabled} />;
  }

  if (type === 'link') {
    return <LinkField context={context} label={label} field={path} disabled={disabled} />;
  }

  if (type === 'image' || type === 'media') {
    return (
      <MediaField
        context={context}
        label={label}
        field={path}
        mode={type}
        disabled={disabled}
        attachments={[]}
        pendingAttachments={[]}
        entitySharedId=""
        onRegisterPendingAttachment={() => undefined}
        onRemovePendingAttachment={() => undefined}
        imageStyle={type === 'image' ? imageStyle(property.style) : undefined}
      />
    );
  }

  return <TextField context={context} label={label} field={path} disabled={disabled} type="text" />;
};

export { LibraryMultiEditTranslatedControl };
