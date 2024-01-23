import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as pagesAPI from 'V2/api/pages';
import { Page } from 'V2/shared/types';

const pageEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.sharedId) {
      const page = await pagesAPI.getBySharedId(params.sharedId, headers);

      return page;
    }

    return null;
  };

const PageEditor = () => {
  const page = useLoaderData() as Page;

  if (page) {
    return <h1>Edit page {page.title}</h1>;
  }

  return <h1>New page</h1>;
};

export { PageEditor, pageEditorLoader };
