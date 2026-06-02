import { validateHomePageRoute } from './utils/routeHelpers.js';
import { ClientSettings } from '#app/apiResponseTypes.js';

const ssrLog = (msg: string, data?: Record<string, unknown>) => {
  if (process.env.DEBUG_SSR) {
    const payload = data ? ` ${JSON.stringify(data)}` : '';
    // eslint-disable-next-line no-console
    console.log(`[SSR getIndexElement] ${msg}${payload}`);
  }
};

export type IndexDescriptor =
  | {
      branch: 'libraryDefault';
      defaultToLibrary: true;
      libraryDefault: {
        userId: string | undefined;
        defaultLibraryView: string | undefined;
        private: boolean | undefined;
      };
    }
  | { branch: 'libraryCustom'; defaultToLibrary: true; libraryCustom: { customHomePage: string[] } }
  | { branch: 'page'; defaultToLibrary: false; parameters: { sharedId: string }; pageId: string }
  | { branch: 'entity'; defaultToLibrary: false; entityId: string }
  | { branch: 'navigate'; defaultToLibrary: true; navigateTo: string };

const getIndexDescriptor = (
  settings: ClientSettings | undefined,
  userId: string | undefined
): IndexDescriptor & { parameters?: { sharedId?: string } } => {
  ssrLog('getIndexElement called', {
    home_page: settings?.home_page,
    defaultLibraryView: settings?.defaultLibraryView,
    private: settings?.private,
  });
  const customHomePage = settings?.home_page ? settings?.home_page.split('/').filter(v => v) : [];
  const isValidHomePage = validateHomePageRoute(settings?.home_page || '');
  const defaultToLibrary = true;

  if (!isValidHomePage || customHomePage.length === 0) {
    ssrLog('branch: getLibraryDefault');
    return {
      branch: 'libraryDefault',
      defaultToLibrary,
      parameters: undefined,
      libraryDefault: {
        userId,
        defaultLibraryView: settings?.defaultLibraryView,
        private: settings?.private,
      },
    };
  }

  if (customHomePage.includes('page')) {
    const pageId = customHomePage[customHomePage.indexOf('page') + 1];
    ssrLog('branch: page');
    return {
      branch: 'page',
      defaultToLibrary: false,
      parameters: { sharedId: pageId },
      pageId,
    };
  }

  if (customHomePage.includes('entity')) {
    const entityId = customHomePage[customHomePage.indexOf('entity') + 1];
    ssrLog('branch: entity');
    return {
      branch: 'entity',
      defaultToLibrary: false,
      entityId,
    };
  }

  if (customHomePage.includes('library')) {
    ssrLog('branch: getCustomLibraryPage');
    return {
      branch: 'libraryCustom',
      defaultToLibrary,
      parameters: undefined,
      libraryCustom: { customHomePage },
    };
  }

  return {
    branch: 'navigate',
    defaultToLibrary,
    parameters: undefined,
    navigateTo: customHomePage.join('/'),
  };
};

export { getIndexDescriptor };
