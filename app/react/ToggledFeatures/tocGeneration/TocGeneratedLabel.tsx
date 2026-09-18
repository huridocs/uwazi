import React from 'react';
import { FeatureToggle } from '#app/components/Elements/FeatureToggle.js';
import { FileType } from '#shared/types/fileType.js';

export interface TocGeneratedLabelProps {
  file: FileType;
  children: React.ReactElement<any> | number | string;
}

export const TocGeneratedLabel = ({ file, children }: TocGeneratedLabelProps) => (
  <FeatureToggle feature="tocGeneration">
    {file.generatedToc && <div className="badge">{children}</div>}
  </FeatureToggle>
);
