import React from 'react';

const SettingsFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1">
    {children}
  </div>
);

export { SettingsFooter };
