import React from 'react';
import type { TocSchema } from '#shared/types/commonTypes.js';
import type { FileType } from '#shared/types/fileType.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { ToCView } from './ToCView.js';
import { ToCFooterBar } from './ToCFooterBar.js';
import { useToCPanel } from './useToCPanel.js';

const ToCPanel = ({
  toc,
  generatedToc,
  file,
}: {
  toc?: TocSchema[];
  generatedToc?: boolean;
  file?: FileType;
}) => {
  const panel = useToCPanel({ toc, file });

  return (
    <Panel>
      <Panel.Body className="px-1">
        <ToCView generatedToc={generatedToc} panel={panel} />
      </Panel.Body>
      <Panel.Footer>
        <ToCFooterBar panel={panel} />
      </Panel.Footer>
    </Panel>
  );
};

export { ToCPanel };
