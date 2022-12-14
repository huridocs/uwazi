import React from 'react';
import { Navigate } from 'react-router-dom';
import { Settings } from 'shared/types/settingsType';
import { validateHomePageRoute } from './utils/routeHelpers';
import { PageView } from './Pages/PageView';
import { LibraryTable } from './Library/LibraryTable';
import { LibraryMap } from './Library/LibraryMap';
import { LibraryCards } from './Library/Library';

const getLibraryDefault = (userId: string | undefined, defaultLibraryView: string | undefined) => {
  if (userId) {
    return <Navigate to="/library/?q=(includeUnpublished:!t)" state={{ isClient: true }} />;
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
  const homePage = settings?.home_page;
  const customHomePage = homePage ? homePage.split('/').filter(v => v) : [];

  if (!validateHomePageRoute(homePage || '') || customHomePage.length === 0) {
    return getLibraryDefault(userId, settings?.defaultLibraryView);
  }

  if (customHomePage.includes('page')) {
    const pageId = customHomePage[customHomePage.indexOf('page') + 1];
    return <PageView params={{ sharedId: pageId }} />;
  }

  return <Navigate to={customHomePage.join('/')} />;
};

export { getIndexElement };
