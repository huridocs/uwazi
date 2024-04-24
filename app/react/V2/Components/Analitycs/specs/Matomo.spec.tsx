/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'jotai';
import { atomsGlobalState } from 'V2/shared/testingHelpers';
import { Matomo } from '../Matomo';

declare global {
  interface Window {
    _paq?: [string[]];
  }
}

describe('Matomo', () => {
  beforeEach(() => {
    render(<Matomo />);
  });

  it.each`
    url          | id           | secondaryId  | secondaryUrl
    ${'url/'}    | ${'id1'}     | ${'sUrl1'}   | ${'sId1'}
    ${'url'}     | ${'id2'}     | ${undefined} | ${undefined}
    ${undefined} | ${undefined} | ${'sUrl1'}   | ${'sId1'}
    ${undefined} | ${undefined} | ${undefined} | ${undefined}
  `(
    'should include matomo script with the appropiate urls',
    ({ url, id, secondaryId, secondaryUrl }) => {
      window._paq = undefined;
      const matomoConfig = url && id && `{"url":"${url}","id":"${id}"}`;

      const store = atomsGlobalState({
        settings: { ...(matomoConfig && { matomoConfig }) },
      });

      render(
        <Provider store={store}>
          <Matomo />
        </Provider>
      );

      if (url && id) {
        expect(window._paq).toEqual([
          ['trackPageView'],
          ['enableLinkTracking'],
          ['setTrackerUrl', `${url}/piwik.php`],
          ['setSiteId', `${id}`],
        ]);
      }

      if (!url || !id) {
        expect(window._paq).toBe(undefined);
      }
    }
  );

  it('should not include script when id or url are not set', () => {
    window._paq = undefined;
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];
  });
});
