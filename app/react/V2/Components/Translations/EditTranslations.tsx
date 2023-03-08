import React from 'react';
import { Params, useLoaderData } from 'react-router-dom';
import * as translationsAPI from '../../api/translations/index';

const editTranslationsLoader = ({ request, params }: { request: Request; params: Params }) =>
  translationsAPI.get(request, params);

const EditTranslations = () => {
  const translations = useLoaderData();
  return <pre>{JSON.stringify(translations, null, 2)}</pre>;
};

export { EditTranslations, editTranslationsLoader };
