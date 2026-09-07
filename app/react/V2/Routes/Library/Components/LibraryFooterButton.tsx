import React, { type ReactNode } from 'react';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';

const footerButtonClassName =
  'inline-flex items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink cursor-pointer disabled:cursor-default disabled:opacity-40 disabled:hover:bg-warm';

type LibraryFooterButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  to?: string;
  className?: string;
};

const LibraryFooterButton = ({
  children,
  icon,
  onClick,
  disabled = false,
  to,
  className = '',
}: LibraryFooterButtonProps) => {
  const classes = `${footerButtonClassName} ${className}`.trim();
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <I18NLink to={to} className={classes}>
        {content}
      </I18NLink>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
};

export type { LibraryFooterButtonProps };
export { LibraryFooterButton };
