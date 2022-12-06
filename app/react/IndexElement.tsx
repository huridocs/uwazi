import React from 'react';
import { Navigate, useLoaderData } from 'react-router-dom';
import { UserSchema } from 'shared/types/userType';
import { Settings } from 'shared/types/settingsType';
import { validateHomePageRoute } from './utils/routeHelpers';
import PageView from './Pages/PageView';
import { LibraryTable } from './Library/LibraryTable';
import { LibraryMap } from './Library/LibraryMap';
import { LibraryCards } from './Library/Library';

const getLibraryDefault = (
  user: UserSchema | undefined,
  defaultLibraryView: string | undefined
) => {
  if (user?._id) {
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

const IndexElement = () => {
  const { user, collectionSettings } = useLoaderData() as {
    user: UserSchema;
    collectionSettings: Settings;
  };

  const homePage = collectionSettings.home_page;
  const customHomePage = homePage ? homePage.split('/').filter(v => v) : [];

  if (!validateHomePageRoute(homePage || '') || customHomePage.length === 0) {
    return getLibraryDefault(user, collectionSettings.defaultLibraryView);
  }

  if (customHomePage.includes('page')) {
    const pageId = customHomePage[customHomePage.indexOf('page') + 1];
    const PageComponent = props => <PageView {...props} params={{ sharedId: pageId }} />;
    //   component.requestState = async requestParams =>
    //     PageView.requestState(requestParams.set({ sharedId: pageId }));

    return <PageComponent />;
    //   return {
    //     component,
    //     customHomePageId: pageId,
    //   };
  }

  return <Navigate to={customHomePage.join('/')} />;
};

export { IndexElement };
