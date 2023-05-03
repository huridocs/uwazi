import { ReactNode } from 'react';
import { atom } from 'recoil';

type sidePanelConfig = {
  content: JSX.Element | ReactNode;
  closeSidepanelFunction: () => any;
  title?: ReactNode | string;
  withOverlay?: boolean;
};

const sidepanelShow = atom({
  key: 'sidepanelShow',
  default: false,
});

const sidepanelConfig = atom({
  key: 'sidepanelContent',
  default: {
    content: '',
    closeSidepanelFunction: () => {},
    title: undefined,
    withOverlay: false,
  } as sidePanelConfig,
});

export { sidepanelShow, sidepanelConfig };
