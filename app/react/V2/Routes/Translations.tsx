import React from 'react';
import { useSetRecoilState } from 'recoil';
import { Outlet, useLoaderData } from 'react-router-dom';
import { translationsAtom } from '../Components/Translations/atoms';

const Translations = () => {
  const setAtom = useSetRecoilState(translationsAtom);
  setAtom(useLoaderData());
  return <Outlet />;
};

export { Translations };
