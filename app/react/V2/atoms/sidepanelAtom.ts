import { atom } from 'recoil';

const sidepanelShow = atom({
  key: 'sidepanelShow',
  default: false,
});

const sidepanelConfig = atom({
  key: 'sidepanelContent',
  default: { content: undefined as JSX.Element | undefined, withOverlay: false },
});

export { sidepanelShow, sidepanelConfig };
