import React from 'react';
import { DrawerFilesList } from '../../Components/Files/DrawerFilesList.js';

const FilesListSideTab = () => (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <DrawerFilesList />
  </div>
);

export { FilesListSideTab };
