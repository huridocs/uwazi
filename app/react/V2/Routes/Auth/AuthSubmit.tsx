import React, { ReactNode } from 'react';

const AuthSubmit = ({
  pending,
  label,
  pendingLabel,
}: {
  pending?: boolean;
  label: ReactNode;
  pendingLabel?: ReactNode;
}) => (
  <button
    type="submit"
    data-part="submit"
    disabled={pending}
    aria-busy={pending || undefined}
    className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-ink bg-ink text-sm font-medium text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-wait disabled:opacity-80"
  >
    {pending ? pendingLabel : label}
  </button>
);

export { AuthSubmit };
