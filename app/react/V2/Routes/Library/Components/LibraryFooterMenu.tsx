import React, { useEffect, type ReactNode, type RefObject } from 'react';
import { AnchoredPortal } from '#V2/Components/UI/AnchoredPortal.js';

type LibraryFooterMenuProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  menuId: string;
  prefer?: 'start' | 'end';
  children: ReactNode;
};

const LibraryFooterMenu = ({
  open,
  onClose,
  anchorRef,
  label,
  menuId,
  prefer = 'start',
  children,
}: LibraryFooterMenuProps) => {
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <AnchoredPortal
      open={open}
      anchorRef={anchorRef}
      prefer={prefer}
      onClose={onClose}
      className="min-w-44 rounded-md border border-border bg-paper py-1 shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
    >
      <div id={menuId} role="menu" aria-label={label}>
        {children}
      </div>
    </AnchoredPortal>
  );
};

export type { LibraryFooterMenuProps };
export { LibraryFooterMenu };
