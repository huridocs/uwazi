import React from 'react';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import { FileType } from 'shared/types/fileType';

export interface TocGeneratedLabelProps {
  file: FileType;
  children: React.ReactChild;
}

export const TocGeneratedLabel = ({ file, children }: TocGeneratedLabelProps) => (
  <FeatureToggle feature="tocGeneration">
    {file.generatedToc && <div className="badge">{children}</div>}
  </FeatureToggle>
);
