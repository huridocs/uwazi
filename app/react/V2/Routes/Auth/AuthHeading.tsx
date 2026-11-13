import React, { ReactNode } from 'react';

const AuthHeading = ({
  eyebrow,
  title,
  lead,
  titleRef,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  titleRef?: React.Ref<HTMLHeadingElement>;
}) => (
  <>
    {eyebrow ? (
      <p
        data-part="collection-name"
        className="mb-2 truncate text-sm font-medium text-ink-secondary"
      >
        {eyebrow}
      </p>
    ) : null}
    <h1
      ref={titleRef}
      tabIndex={-1}
      className="text-2xl font-semibold tracking-tight text-ink focus:outline-none"
    >
      {title}
    </h1>
    {lead ? <p className="mt-1.5 text-sm text-ink-tertiary">{lead}</p> : null}
  </>
);

export { AuthHeading };
