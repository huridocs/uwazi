import React from 'react';
import { CopyValueInput } from '#V2/Components/UI/CopyValueInput.js';
import { buildEmbedSnippet } from '#V2/Dataviz/utils/buildEmbedSnippet.js';

type EmbedPanelProps = {
  id: string;
};

const EmbedPanel = ({ id }: EmbedPanelProps) => {
  const snippet = buildEmbedSnippet(id);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">Embed</h3>
      <CopyValueInput id="dataviz-embed" label="Embed code" value={snippet} />
    </section>
  );
};

export { EmbedPanel };
