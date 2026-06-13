import React from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import { PageEmbedView } from '#app/Pages/PageEmbedView.js';

const PageEmbedRoute = () => {
  const settings = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private });
  const isAuthenticated = Boolean(user?._id);

  if (!externalEmbedAllowed && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-ink-secondary">
          Embedding is not available on private instances.
        </p>
      </div>
    );
  }

  return <PageEmbedView />;
};

export { PageEmbedRoute };
