import React from 'react';
import { I18NLink, Translate } from '#app/I18N/index.js';
import { useRememberedLibraryUrl } from '#V2/Routes/Library/useRememberedLibraryUrl.js';

const LibraryLink = ({ to, libraryV2 }: { to: string; libraryV2: boolean }) => (
  <I18NLink to={useRememberedLibraryUrl(to, libraryV2)}>
    <Translate>Library</Translate>
  </I18NLink>
);

export { LibraryLink };
