import React from 'react';
import { FileSideTabContent } from '../../Components/Files/FileSideTabContent.js';

const FileTab = () => (
  <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
    <FileSideTabContent />
  </div>
);

export { FileTab };
