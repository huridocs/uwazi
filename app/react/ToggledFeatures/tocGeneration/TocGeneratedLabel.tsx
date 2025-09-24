import React from 'react';
import { FeatureToggle } from '../../components/Elements/FeatureToggle.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';

export interface TocGeneratedLabelProps {
  file: FileType;
  children: React.ReactChild;
}

export const TocGeneratedLabel = ({ file, children }: TocGeneratedLabelProps) => (
  <FeatureToggle feature="tocGeneration">
    {file.generatedToc && <div className="badge">{children}</div>}
  </FeatureToggle>
);
