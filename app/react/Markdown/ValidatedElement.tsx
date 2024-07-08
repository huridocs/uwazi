import React from 'react';
import { validHtmlTags } from './utils';

const isValidTagName = (tagName: string): boolean => validHtmlTags.has(tagName);

const ValidatedElement = (
  type: string | React.JSXElementConstructor<any>,
  props: (React.Attributes & { children?: React.ReactNode }) | null,
  ...children: React.ReactNode[]
): React.ReactElement | null => {
  if (typeof type === 'string' && !isValidTagName(type)) {
    return React.createElement('div', { className: 'error' }, `Invalid tag: ${type}`);
  }

  const validatedChildren = children.map(child => {
    if (Array.isArray(child)) {
      return child.map(c => {
        const childProps = c.props as React.Attributes & { children?: React.ReactNode };
        return React.isValidElement(c)
          ? ValidatedElement(c.type, childProps, ...React.Children.toArray(childProps.children))
          : c;
      });
    }
    if (React.isValidElement(child)) {
      return ValidatedElement(
        child.type,
        child.props as React.Attributes & { children?: React.ReactNode },
        ...React.Children.toArray(child.props.children)
      );
    }
    return child;
  });

  return React.createElement(type, props, ...validatedChildren);
};

export { ValidatedElement };
