import { useId, useRef, useState, type RefObject } from 'react';
import { t } from '#app/I18N/index.js';

type FooterMenuState = {
  open: boolean;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  ref: RefObject<HTMLElement | null>;
  menuId: string;
  label: string;
  close: () => void;
};

const useFooterMenu = (labelKey: string): FooterMenuState => {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const label = t('System', labelKey, null, false);
  const close = () => setOpen(false);
  return { open, setOpen, ref, menuId, label, close };
};

const useLibraryResultsFooterMenus = () => {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const actions = useFooterMenu('Actions');
  const panes = useFooterMenu('Library panes');
  const actionsRef = actions.ref as RefObject<HTMLDivElement | null>;
  const panesRef = panes.ref as RefObject<HTMLButtonElement | null>;

  return {
    pdfInputRef,
    actionsRef,
    panesRef,
    actionsOpen: actions.open,
    panesOpen: panes.open,
    actionsMenuId: actions.menuId,
    panesMenuId: panes.menuId,
    actionsLabel: actions.label,
    panesLabel: panes.label,
    closeActions: actions.close,
    closePanes: panes.close,
    toggleActions: () => {
      panes.close();
      actions.setOpen(open => !open);
    },
    togglePanes: () => {
      actions.close();
      panes.setOpen(open => !open);
    },
  };
};

export { useLibraryResultsFooterMenus };
