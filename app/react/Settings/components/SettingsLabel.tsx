import React from 'react';

export interface SettingsLabelProps {
  children: JSX.Element[] | JSX.Element;
}

export const SettingsLabel = ({ children }: SettingsLabelProps) => (
  <div className="inline-form-label">{children}</div>
);
