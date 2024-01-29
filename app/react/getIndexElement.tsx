import React from 'react';
import { Navigate } from 'react-router-dom';
import { ClientSettings } from 'app/apiResponseTypes';
import { validateHomePageRoute } from './utils/routeHelpers';
import { PageView } from './Pages/PageView';
import { LibraryTable } from './Library/LibraryTable';
import { LibraryMap } from './Library/LibraryMap';
import { LibraryCards } from './Library/Library';
import { Login } from './Users/Login';
import { ViewerRoute } from './Viewer/ViewerRoute';

const getCustomLibraryPage = (customHomePage: string[]) => {
  const [query] = customHomePage.filter(path => path.startsWith('?'));
  const queryString = `(${query.substring(1)})`;

  if (customHomePage.includes('map')) {
    return <LibraryMap params={{ q: queryString }} />;
  }

  if (customHomePage.includes('table')) {
    return <LibraryTable params={{ q: queryString }} />;
  }

  return <LibraryCards params={{ q: queryString }} />;
};

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

// eslint-disable-next-line max-statements
const getIndexElement = (settings: ClientSettings | undefined, userId: string | undefined) => {
  const customHomePage = settings?.home_page ? settings?.home_page.split('/').filter(v => v) : [];
  const isValidHomePage = validateHomePageRoute(settings?.home_page || '');
  let element = <Navigate to={customHomePage.join('/')} />;
  let parameters;

  switch (true) {
    case !isValidHomePage || customHomePage.length === 0:
      element = getLibraryDefault(userId, settings?.defaultLibraryView, settings?.private);
      break;

    case isValidHomePage && customHomePage.includes('page'):
      {
        const pageId = customHomePage[customHomePage.indexOf('page') + 1];
        element = <PageView params={{ sharedId: pageId }} />;
        parameters = { sharedId: pageId };
      }
      break;

    case isValidHomePage && customHomePage.includes('entity'):
      {
        const pageId = customHomePage[customHomePage.indexOf('entity') + 1];
        element = <ViewerRoute params={{ sharedId: pageId }} />;
      }
      break;

    case isValidHomePage && customHomePage.includes('library'):
      element = getCustomLibraryPage(customHomePage);
      break;

    default:
      break;
  }

  return { element, parameters };
};

export { getIndexElement };
