import React from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

type LabelVariant = 'primary' | 'secondary';

interface LabelProps {
  htmlFor?: string;
  children: string | React.ReactNode;
  hasErrors?: boolean;
  hideLabel?: boolean;
  variant?: LabelVariant;
}

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const variantClass: Record<LabelVariant, string> = {
  primary: 'block text-sm font-bold',
  secondary: 'block text-xs',
};

const variantColor: Record<LabelVariant, string> = {
  primary: 'text-ink',
  secondary: 'text-ink-tertiary',
};

const Label = ({
  htmlFor,
  children,
  hasErrors = false,
  hideLabel,
  variant = 'primary',
}: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={
      hideLabel
        ? 'sr-only'
        : cx(variantClass[variant], hasErrors ? 'text-seal' : variantColor[variant])
    }
  >
    {renderChild(children)}
  </label>
);

export { Label };
export type { LabelVariant };
