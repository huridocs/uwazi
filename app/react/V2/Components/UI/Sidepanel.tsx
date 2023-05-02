import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { sidepanelConfig, sidepanelShow } from 'app/V2/atoms';
import { Translate } from 'app/I18N';

const Sidepanel = () => {
  const [isOpen, setIsOpen] = useRecoilState(sidepanelShow);
  const { content, title, withOverlay } = useRecoilValue(sidepanelConfig);

  const sidepanelDisplay = withOverlay ? 'z-3 absolute ' : 'z-2 fixed ';

  if (isOpen) {
    return (
      <div
        className={
          withOverlay ? 'z-2 bg-gray-900 bg-opacity-50 fixed h-full w-full top-0 left-0' : ''
        }
      >
        <aside
          className={`${sidepanelDisplay} h-full top-0 right-0 bg-white w-4/5 md:w-[400px] border-l-2 px-2 py-4`}
        >
          <div className="flex mb-2 text-gray-500">
            <h1 className="grow uppercase font-bold">{title}</h1>
            <button type="button" className="justify-end" onClick={() => setIsOpen(false)}>
              <span className="sr-only">
                <Translate>Close</Translate>
              </span>
              <XMarkIcon className="w-5" />
            </button>
          </div>
          <div>{content}</div>
        </aside>
      </div>
    );
  }

  return <div />;
};

export { Sidepanel };
