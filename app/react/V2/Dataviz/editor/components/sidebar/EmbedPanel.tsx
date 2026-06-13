import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import { CopyValueInput } from '#V2/Components/UI/CopyValueInput.js';
import { isPersistedId } from '#V2/Dataviz/api/httpDatavizApi.js';
import {
  buildExternalDatavizEmbedUrl,
  buildExternalDatavizIframeSnippet,
  buildPageEmbedSnippet,
} from '#V2/Dataviz/utils/buildEmbedSnippet.js';

type EmbedPanelProps = {
  id: string;
};

const EmbedPanel = ({ id }: EmbedPanelProps) => {
  const settings = useAtomValue(settingsAtom);
  const defaultLocale = settings.languages?.find(language => language.default)?.key ?? 'en';
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private });
  const persisted = isPersistedId(id);

  const pageSnippet = useMemo(() => (persisted ? buildPageEmbedSnippet(id) : ''), [id, persisted]);

  const iframeSnippet = useMemo(() => {
    if (!persisted || !externalEmbedAllowed) {
      return '';
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = buildExternalDatavizEmbedUrl(origin, id, defaultLocale);
    return buildExternalDatavizIframeSnippet(url);
  }, [id, persisted, externalEmbedAllowed, defaultLocale]);

  if (!persisted) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink">Embed</h3>
        <p className="text-sm text-ink-secondary">Save the visualization to get embed code.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-ink">Embed</h3>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">Embed in pages</p>
        <p className="text-xs text-ink-secondary">
          Paste this tag in a page HTML. The chart uses the page language.
        </p>
        <CopyValueInput id="dataviz-page-embed" label="Page embed code" value={pageSnippet} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">External embed</p>
        {externalEmbedAllowed ? (
          <>
            <p className="text-xs text-ink-secondary">
              Use this iframe on external sites. Change <code>?locale=</code> in the URL if needed.
            </p>
            <CopyValueInput
              id="dataviz-external-embed"
              label="External iframe code"
              value={iframeSnippet}
            />
          </>
        ) : (
          <p className="text-sm text-ink-secondary">
            External embedding is disabled on private instances.
          </p>
        )}
      </div>
    </section>
  );
};

export { EmbedPanel };
