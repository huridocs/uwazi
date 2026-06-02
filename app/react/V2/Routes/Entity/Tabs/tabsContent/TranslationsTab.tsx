import React from 'react';
import { TranslationsSideTabContent } from '../../Components/Files/TranslationsSideTabContent.js';

const TranslationsTab = () => (
  <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
    <TranslationsSideTabContent />
  </div>
);

export { TranslationsTab };
