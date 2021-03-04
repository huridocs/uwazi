import React from 'react';

export interface SettingsLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SettingsLabel = ({ children, className }: SettingsLabelProps) => (
  <div className={`inline-form-label ${className}`}>{children}</div>
);
