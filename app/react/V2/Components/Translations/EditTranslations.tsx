import React from 'react';
import { useLoaderData, useParams } from 'react-router-dom';
import * as translationsAPI from '../../api/translations/index';

const editTranslationsLoader = ({ request }: { request: Request }) => translationsAPI.get(request);

const EditTranslations = () => {
  const translations = useLoaderData();
  const context = useParams();
  return <>Something</>;
};

export { EditTranslations, editTranslationsLoader };
