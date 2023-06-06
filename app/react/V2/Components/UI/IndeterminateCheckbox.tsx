import React, { HTMLProps, useEffect, useRef } from 'react';

const IndeterminateCheckbox = ({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) => {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <input type="checkbox" ref={ref} className={`rounded cursor-pointer ${className}`} {...rest} />
  );
};

export { IndeterminateCheckbox };
