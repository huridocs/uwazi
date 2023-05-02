import React from 'react';
import { useRecoilValue } from 'recoil';
import { sidepanelConfig, sidepanelShow } from 'app/V2/atoms';

const Sidepanel = () => {
  const isOpen = useRecoilValue(sidepanelShow);
  const { content, withOverlay } = useRecoilValue(sidepanelConfig);

  const sidepanelStyles = 'bg-white w-4/5 md:w-[400px] border-l-2';
  const contentStyles = 'p-2';

  if (isOpen && withOverlay) {
    return (
      <div className="z-2 bg-gray-900 bg-opacity-50 fixed h-full w-full top-0 left-0">
        <aside className={`z-3 absolute h-full top-0 right-0 ${sidepanelStyles}`}>
          <div className={contentStyles}>{content}</div>
        </aside>
      </div>
    );
  }

  if (isOpen) {
    return (
      <aside className={`z-2 fixed h-full top-0 right-0 ${sidepanelStyles}`}>
        <div className={contentStyles}>{content}</div>
      </aside>
    );
  }

  return <div />;
};

export { Sidepanel };
