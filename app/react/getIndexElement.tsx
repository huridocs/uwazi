import React from 'react';
import { Navigate } from 'react-router-dom';
import { Settings } from 'shared/types/settingsType';
import { validateHomePageRoute } from './utils/routeHelpers';
import { PageView } from './Pages/PageView';
import { LibraryTable } from './Library/LibraryTable';
import { LibraryMap } from './Library/LibraryMap';
import { LibraryCards } from './Library/Library';
import { Login } from './Users/Login';

const getLibraryDefault = (
  userId: string | undefined,
  defaultLibraryView: string | undefined,
  privateInstance: boolean | undefined
) => {
  if (userId) {
    return <Navigate to="/library/?q=(includeUnpublished:!t)" state={{ isClient: true }} />;
  }

  if (privateInstance) {
    return <Login />;
  }

  switch (defaultLibraryView) {
    case 'table':
      return <LibraryTable />;

    case 'map':
      return <LibraryMap />;

    case 'cards':
    default:
      return <LibraryCards />;
  }
};

const getIndexElement = (settings: Settings | undefined, userId: string | undefined) => {
  const customHomePage = settings?.home_page ? settings?.home_page.split('/').filter(v => v) : [];
  let element = <Navigate to={customHomePage.join('/')} />;
  let parameters;

  if (!validateHomePageRoute(settings?.home_page || '') || customHomePage.length === 0) {
    element = getLibraryDefault(userId, settings?.defaultLibraryView, settings?.private);
  }

  if (customHomePage.includes('page')) {
    const pageId = customHomePage[customHomePage.indexOf('page') + 1];
    element = <PageView params={{ sharedId: pageId }} />;
    parameters = { sharedId: pageId };
  }

  return { element, parameters };
};

export { getIndexElement };
