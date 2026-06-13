import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import { CopyValueInput } from '#V2/Components/UI/CopyValueInput.js';
import {
  buildExternalPageEmbedUrl,
  buildExternalPageIframeSnippet,
} from '#V2/Dataviz/utils/buildEmbedSnippet.js';

type PageEmbedPanelProps = {
  sharedId: string;
};

const PageEmbedPanel = ({ sharedId }: PageEmbedPanelProps) => {
  const settings = useAtomValue(settingsAtom);
  const defaultLocale = settings.languages?.find(language => language.default)?.key ?? 'en';
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private });

  const iframeSnippet = useMemo(() => {
    if (!externalEmbedAllowed) {
      return '';
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = buildExternalPageEmbedUrl(origin, sharedId, defaultLocale);
    return buildExternalPageIframeSnippet(url);
  }, [sharedId, externalEmbedAllowed, defaultLocale]);

  return (
    <section className="flex flex-col gap-2 pt-4 border-t border-border">
      <p className="text-sm font-medium text-ink">External embed</p>
      {externalEmbedAllowed ? (
        <>
          <p className="text-xs text-ink-secondary">
            Embed this published page on external sites. Change <code>?locale=</code> in the URL if
            needed.
          </p>
          <CopyValueInput
            id={`page-external-embed-${sharedId}`}
            label="External iframe code"
            value={iframeSnippet}
          />
        </>
      ) : (
        <p className="text-sm text-ink-secondary">
          External embedding is disabled on private instances.
        </p>
      )}
    </section>
  );
};

export { PageEmbedPanel };
