import React from 'react';
import { useRecoilValue } from 'recoil';
import { translationsAtom } from './atoms';

const TranslationsList = () => {
  const translations = useRecoilValue(translationsAtom);
  return <div>{JSON.stringify(translations, null, 2)}</div>;
};

export { TranslationsList };
