import React from 'react';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import { FileType } from 'shared/types/fileType';

export interface TocGeneratedLabelProps {
  file: FileType;
  children: JSX.Element | string;
}

export const TocGeneratedLabel = ({ file, children }: TocGeneratedLabelProps) => (
  <FeatureToggle feature="tocGeneration">
    {file.generatedToc && <span className="badge">{children}</span>}
  </FeatureToggle>
);
