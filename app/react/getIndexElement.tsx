import React from 'react';
import { Navigate } from 'react-router-dom';
import { validateHomePageRoute } from './utils/routeHelpers';
import { PageView } from './Pages/PageView';
import { LibraryTable } from './Library/LibraryTable';
import { LibraryMap } from './Library/LibraryMap';
import { LibraryCards } from './Library/Library';
import { store } from './store';

const getLibraryDefault = (userId: string | undefined, defaultLibraryView: string | undefined) => {
  if (userId) {
    return <Navigate to="/library/?q=(includeUnpublished:!t)" />;
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

const getIndexElement = () => {
  const reduxState = store?.getState();
  const { settings, user } = reduxState || {};

  const homePage = settings?.collection.get('home_page');
  const customHomePage = homePage ? homePage.split('/').filter(v => v) : [];

  if (!validateHomePageRoute(homePage || '') || customHomePage.length === 0) {
    return getLibraryDefault(user?.get('_id'), settings?.collection.get('defaultLibraryView'));
  }

  if (customHomePage.includes('page')) {
    const pageId = customHomePage[customHomePage.indexOf('page') + 1];
    return <PageView params={{ sharedId: pageId }} />;
  }

  return <Navigate to={customHomePage.join('/')} />;
};

export { getIndexElement };
