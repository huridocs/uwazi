import React from 'react';
import { Pill } from 'V2/Components/UI';

const LanguagePill = ({
  languageKey,
  status,
}: {
  languageKey: string | undefined;
  status: string;
}) => {
  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (status === 'defaultLanguage') color = 'primary';
  if (status === 'untranslated') color = 'yellow';

  return <Pill color={color}>{languageKey?.toUpperCase()}</Pill>;
};

export { LanguagePill };
