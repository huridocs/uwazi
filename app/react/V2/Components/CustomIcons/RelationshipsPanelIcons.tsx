import React, { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const strokeSvg = (children: React.ReactNode, { className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    // eslint-disable-next-line react/jsx-props-no-spreading -- passing props to svg
    {...props}
  >
    {children}
  </svg>
);

const LayoutListIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <path d="M14 4h7" />
      <path d="M14 9h7" />
      <path d="M14 15h7" />
      <path d="M14 20h7" />
    </>,
    props
  );

const ListTreeIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <path d="M21 12h-8" />
      <path d="M21 6H8" />
      <path d="M21 18h-8" />
      <path d="M3 6v4c0 1.1.9 2 2 2h3" />
      <path d="M3 10v6c0 1.1.9 2 2 2h3" />
    </>,
    props
  );

const NetworkIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </>,
    props
  );

const Rows3Icon = (props: IconProps) =>
  strokeSvg(
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M21 9H3" />
      <path d="M21 15H3" />
    </>,
    props
  );

const CircleDotIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </>,
    props
  );

export { CircleDotIcon, LayoutListIcon, ListTreeIcon, NetworkIcon, Rows3Icon };
