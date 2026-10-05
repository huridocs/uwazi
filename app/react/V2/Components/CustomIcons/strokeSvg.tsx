import React, { type ReactNode, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const strokeSvg = (children: ReactNode, { className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  >
    {children}
  </svg>
);

export { strokeSvg };
export type { IconProps };
