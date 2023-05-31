import React from 'react';
import { Pill } from 'app/V2/Components/UI';

const LanguagePill = ({ cell }: any) => {
  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (cell.value.status === 'defaultLanguage') color = 'primary';
  if (cell.value.status === 'untranslated') color = 'yellow';

  return <Pill color={color}>{cell.value.languageKey.toUpperCase()}</Pill>;
};

export { LanguagePill };
