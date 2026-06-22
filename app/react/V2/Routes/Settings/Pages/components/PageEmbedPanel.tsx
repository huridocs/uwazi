import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import { CopyValueInput, ToggleButton } from '#V2/Components/UI/index.js';
import {
  buildExternalPageEmbedUrl,
  buildExternalPageIframeSnippet,
} from '#V2/Dataviz/utils/buildEmbedSnippet.js';

type PageEmbedPanelProps = {
  sharedId: string;
  embedPublic?: boolean;
  onEmbedPublicChange?: (value: boolean) => void;
};

const PageEmbedPanel = ({
  sharedId,
  embedPublic = false,
  onEmbedPublicChange,
}: PageEmbedPanelProps) => {
  const settings = useAtomValue(settingsAtom);
  const isPrivateInstance = Boolean(settings.private);
  const defaultLocale = settings.languages?.find(language => language.default)?.key ?? 'en';
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private }, embedPublic);

  const iframeSnippet = useMemo(() => {
    if (!externalEmbedAllowed) {
      return '';
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = buildExternalPageEmbedUrl(origin, sharedId, defaultLocale);
    return buildExternalPageIframeSnippet(url);
  }, [sharedId, externalEmbedAllowed, defaultLocale]);

  return (
    <section className="flex flex-col gap-3 pt-4 border-t border-border">
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
          <Translate>
            Enable public embedding to use this page in external sites on private instances.
          </Translate>
        </p>
      )}
    </section>
  );
};

export { PageEmbedPanel };
