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
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  >
    {children}
  </svg>
);

const PencilStrokeIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </>,
    props
  );

const Trash2StrokeIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>,
    props
  );

const PlusStrokeIcon = (props: IconProps) =>
  strokeSvg(
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>,
    props
  );

export { PencilStrokeIcon, Trash2StrokeIcon, PlusStrokeIcon };
