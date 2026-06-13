import React from 'react';
import { useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { canUseExternalEmbed } from '#shared/embed/canUseExternalEmbed.js';
import { DatavizEmbed } from '#V2/Dataviz/embed/DatavizEmbed.js';

const DatavizEmbedRoute = () => {
  const { id } = useParams();
  const settings = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const externalEmbedAllowed = canUseExternalEmbed({ private: settings.private });
  const isAuthenticated = Boolean(user?._id);

  if (!id) {
    return null;
  }

  if (!externalEmbedAllowed && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-ink-secondary">
          Embedding is not available on private instances.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-4">
      <DatavizEmbed id={id} />
    </div>
  );
};

export { DatavizEmbedRoute };
