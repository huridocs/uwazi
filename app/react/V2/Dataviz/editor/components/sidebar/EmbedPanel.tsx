import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import { CopyValueInput, ToggleButton } from '#V2/Components/UI/index.js';
import { isPersistedId } from '#V2/Dataviz/api/httpDatavizApi.js';
import {
  buildExternalDatavizEmbedUrl,
  buildExternalDatavizIframeSnippet,
  buildPageEmbedSnippet,
} from '#V2/Dataviz/utils/buildEmbedSnippet.js';

type EmbedPanelProps = {
  id: string;
  embedPublic?: boolean;
  onEmbedPublicChange?: (value: boolean) => void;
};

const EmbedPanel = ({ id, embedPublic = false, onEmbedPublicChange }: EmbedPanelProps) => {
  const settings = useAtomValue(settingsAtom);
  const isPrivateInstance = Boolean(settings.private);
  const defaultLocale = settings.languages?.find(language => language.default)?.key ?? 'en';
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private }, embedPublic);
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

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">External embed</p>
        {isPrivateInstance && onEmbedPublicChange && (
          <ToggleButton
            checked={embedPublic}
            onToggle={() => onEmbedPublicChange(!embedPublic)}
            size="small"
          >
            <span className="text-sm text-ink">
              <Translate>Allow public embedding without login</Translate>
            </span>
          </ToggleButton>
        )}
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
            <Translate>
              Enable public embedding to use this chart in external sites on private instances.
            </Translate>
          </p>
        )}
      </div>
    </section>
  );
};

export { EmbedPanel };
