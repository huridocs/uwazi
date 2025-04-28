import { ClientSettings } from 'app/apiResponseTypes';
import React from 'react';
import { Navigate } from 'react-router';
import LibraryRoot from './Library/Library';
import { LibraryCards } from './Library/LibraryCards';
import { LibraryMap } from './Library/LibraryMap';
import { LibraryTable } from './Library/LibraryTable';
import { PageView } from './Pages/PageView';
import { Login } from './Users/Login';
import { validateHomePageRoute } from './utils/routeHelpers';
import { ViewerRoute } from './Viewer/ViewerRoute';

const deconstructSearchQuery = (query?: string) => {
  if (!query) return '';
  if (query.startsWith('?q=')) {
    return decodeURI(query.substring(1).split('=')[1]);
  }
  return `(${query.substring(1)})`;
};

const getCustomLibraryPage = (customHomePage: string[]) => {
  const [query] = customHomePage.filter(path => path.startsWith('?'));
  const searchQuery = deconstructSearchQuery(query);
  const queryString = query ? searchQuery : '';

  if (customHomePage.includes('map')) {
    return (
      <LibraryRoot params={{ q: queryString }}>
        <LibraryMap params={{ q: queryString }} />
      </LibraryRoot>
    );
  }

  if (customHomePage.includes('table')) {
    return (
      <LibraryRoot params={{ q: queryString }}>
        <LibraryTable params={{ q: queryString }} />
      </LibraryRoot>
    );
  }

  return (
    <LibraryRoot params={{ q: queryString }}>
      <LibraryCards params={{ q: queryString }} />
    </LibraryRoot>
  );
};

const getLibraryDefault = (
  userId: string | undefined,
  defaultLibraryView: string | undefined,
  privateInstance: boolean | undefined
) => {
  if (!userId && privateInstance) {
    return <Login />;
  }

  const searchQuery = deconstructSearchQuery('?q=(includeUnpublished:!t)');

  switch (defaultLibraryView) {
    case 'table':
      return (
        <LibraryRoot params={{ ...(userId && { q: searchQuery }) }}>
          <LibraryTable params={{ ...(userId && { q: searchQuery }) }} />
        </LibraryRoot>
      );

    case 'map':
      return (
        <LibraryRoot params={{ ...(userId && { q: searchQuery }) }}>
          <LibraryMap params={{ ...(userId && { q: searchQuery }) }} />
        </LibraryRoot>
      );

    case 'cards':
    default:
      return (
        <LibraryRoot params={{ ...(userId && { q: searchQuery }) }}>
          <LibraryCards params={{ ...(userId && { q: searchQuery }) }} />
        </LibraryRoot>
      );
  }
};

// eslint-disable-next-line max-statements
const getIndexElement = (settings: ClientSettings | undefined, userId: string | undefined) => {
  const customHomePage = settings?.home_page ? settings?.home_page.split('/').filter(v => v) : [];
  const isValidHomePage = validateHomePageRoute(settings?.home_page || '');
  let element = <Navigate to={customHomePage.join('/')} />;
  let parameters;
  let defaultToLibrary = true;
  switch (true) {
    case !isValidHomePage || customHomePage.length === 0:
      element = getLibraryDefault(userId, settings?.defaultLibraryView, settings?.private);
      break;

    case isValidHomePage && customHomePage.includes('page'):
      {
        const pageId = customHomePage[customHomePage.indexOf('page') + 1];
        element = <PageView params={{ sharedId: pageId }} />;
        parameters = { sharedId: pageId };
        defaultToLibrary = false;
      }
      break;

    case isValidHomePage && customHomePage.includes('entity'):
      {
        const pageId = customHomePage[customHomePage.indexOf('entity') + 1];
        element = <ViewerRoute params={{ sharedId: pageId }} />;
        defaultToLibrary = false;
      }
      break;

    case isValidHomePage && customHomePage.includes('library'):
      element = getCustomLibraryPage(customHomePage);
      break;

    default:
      break;
  }

  return { element, parameters, defaultToLibrary };
};

export { getIndexElement };
