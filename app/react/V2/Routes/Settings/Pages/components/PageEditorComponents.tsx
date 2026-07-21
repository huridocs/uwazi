/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';

const HTMLNotification = ({ useLegacyMarkdown = true }: { useLegacyMarkdown?: boolean }) =>
  useLegacyMarkdown ? (
    <div
      className="flex w-fit items-center gap-4 border p-4"
      style={{
        backgroundColor: 'var(--color-theme-info-banner-bg)',
        borderColor: 'var(--color-theme-info-banner-border)',
        color: 'var(--color-theme-info-banner-fg)',
      }}
    >
      <InformationCircleIcon className="w-7 h-7" />
      <div>
        <Translate>
          You can embed advanced components like maps, charts and entity lists in your page.
        </Translate>
        &nbsp;
        <Link
          className="underline hover:text-primary-800"
          target="_blank"
          to="https://uwazi.readthedocs.io/en/latest/admin-docs/analysing-and-visualising-your-collection.html"
          rel="noopener noreferrer"
        >
          <Translate>Documentation</Translate>
        </Link>
      </div>
    </div>
  ) : (
    <div
      className="flex w-fit items-center gap-4 border p-4"
      style={{
        backgroundColor: 'var(--color-theme-info-banner-bg)',
        borderColor: 'var(--color-theme-info-banner-border)',
        color: 'var(--color-theme-info-banner-fg)',
      }}
    >
      <InformationCircleIcon className="w-7 h-7" />
      <div>
        <Translate>
          This page uses HTML only (Markdown is not processed). You can embed maps, charts, entity
          lists, and other components.
        </Translate>
        &nbsp;
        <Link
          className="underline hover:text-primary-800"
          target="_blank"
          to="https://uwazi.readthedocs.io/en/latest/admin-docs/analysing-and-visualising-your-collection.html"
          rel="noopener noreferrer"
        >
          <Translate>Click here</Translate>
        </Link>
        &nbsp;
        <Translate>to learn more about the components.</Translate>
      </div>
    </div>
  );

const MarkdownDeprecationBanner = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <div
    className="flex w-full max-w-2xl flex-col gap-4 border p-4"
    style={{
      backgroundColor: 'var(--color-theme-warning-banner-bg)',
      borderColor: 'var(--color-theme-warning-banner-border)',
      color: 'var(--color-theme-warning-banner-fg)',
    }}
  >
    <div className="flex items-start gap-4">
      <ExclamationTriangleIcon className="w-7 h-7 shrink-0" />
      <div>
        <Translate>
          Markdown support in custom pages will be discontinued starting in 2027. Upgrade this page
          when its content no longer relies on Markdown syntax.
        </Translate>
      </div>
    </div>
    <div>
      <Button type="button" variant="primary" onClick={onUpgrade}>
        <Translate>This page does not need Markdown</Translate>
      </Button>
    </div>
  </div>
);

const JSNotification = () => (
  <div
    className="flex w-fit items-center gap-4 border p-4"
    style={{
      backgroundColor: 'var(--color-theme-warning-banner-bg)',
      borderColor: 'var(--color-theme-warning-banner-border)',
      color: 'var(--color-theme-warning-banner-fg)',
    }}
  >
    <ExclamationTriangleIcon className="w-7 h-7" />
    <div>
      <Translate>With great power comes great responsibility!</Translate>
      <br />
      <Translate>
        This area allows you to append custom Javascript to the page. This opens up a new universe
        of possibilities.
      </Translate>
      &nbsp;
      <Translate>
        It could also very easily break the app. Only write code here if you know exactly what you
        are doing.
      </Translate>
    </div>
  </div>
);

export { HTMLNotification, JSNotification, MarkdownDeprecationBanner };
