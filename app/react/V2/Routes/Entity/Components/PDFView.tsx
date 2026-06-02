import React from 'react';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import type { FileType } from '#V2/api/entities/types.js';
import { DocumentTab } from '../Tabs/tabsContent/DocumentTab.js';
import { DocumentTabFooter } from '../Tabs/footers/DocumentTabFooter.js';

type PDFViewProps = {
  mainDocument: FileType;
  pagePlaintext?: string;
  showViewModeSelect?: boolean;
};

const PDFView = ({ mainDocument, pagePlaintext, showViewModeSelect = false }: PDFViewProps) => (
  <Panel>
    <Panel.Body>
      <DocumentTab
        mainDocument={mainDocument}
        pagePlaintext={pagePlaintext}
        showViewModeSelect={showViewModeSelect}
      />
    </Panel.Body>
    <Panel.Footer>
      <DocumentTabFooter mainDocument={mainDocument} />
    </Panel.Footer>
  </Panel>
);

export { PDFView };
