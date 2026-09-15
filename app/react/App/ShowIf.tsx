import React from 'react';

type ShowIfProps = {
  if: boolean;
  children: React.ReactElement<any>;
};

// eslint-disable-next-line react/jsx-no-useless-fragment
const ShowIf = ({ if: condition, children }: ShowIfProps) => (!condition ? <></> : children);

export { ShowIf };
