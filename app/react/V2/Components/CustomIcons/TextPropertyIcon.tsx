import React from 'react';
import { CustomIconProps } from './types';

const TextPropertyIcon: React.FC<CustomIconProps> = ({ className }) => (
  <svg className={className || ''}>placeholder</svg>
);

export { TextPropertyIcon };
