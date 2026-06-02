import React from 'react';
import { SearchView } from '../../Components/SearchView.js';

const SearchTab = () => (
  <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
    <SearchView />
  </div>
);

export { SearchTab };
