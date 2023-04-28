import React from 'react';
import { useRecoilValue } from 'recoil';
import { sidepanelConfig, sidepanelShow } from 'app/V2/atoms';

const Sidepanel = () => {
  const isOpen = useRecoilValue(sidepanelShow);
  const { content, withOverlay } = useRecoilValue(sidepanelConfig);

  const overlay = withOverlay ? 'bg-gray-900 bg-opacity-50 w-full' : '';

  return isOpen ? (
    <aside className="bg-white absolute top-0 right-0 z-50 h-full overflow-y-auto overflow-x-hidden w-[400px] border-l-2">
      <div className="p-2">{content}</div>
    </aside>
  ) : (
    <div />
  );
};

export { Sidepanel };
