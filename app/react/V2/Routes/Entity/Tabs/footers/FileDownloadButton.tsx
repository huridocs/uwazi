import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';

const iconClass = 'h-3 w-3 shrink-0 text-ink-tertiary';

const triggerDownload = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const FileDownloadButton = ({ href }: { href: string }) => (
  <Button variant="warm" className="inline-flex items-center" onClick={() => triggerDownload(href)}>
    <ArrowDownTrayIcon className={iconClass} />
    <Translate>Download</Translate>
  </Button>
);

export { FileDownloadButton, triggerDownload, iconClass };
