import React, { ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';

type MetadataItem = {
  id: string;
  label: string;
  translationContext: string;
  content: ReactNode;
};

type MetadataItemsTableProps = {
  items: MetadataItem[];
};

const MetadataItemsTable = ({ items }: MetadataItemsTableProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {items.map(item => (
            <tr
              key={item.id}
              data-field-key={item.id}
              className="border-t border-border-40 transition-colors first:border-t-0 hover:bg-warm/30"
            >
              <th
                scope="row"
                className="w-0 whitespace-nowrap py-1.5 pr-6 text-start align-baseline text-micro font-medium uppercase tracking-wide text-ink-tertiary"
              >
                <Translate context={item.translationContext}>{item.label}</Translate>
              </th>
              <td className="w-full max-w-0 py-1.5 align-baseline text-ink">{item.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { MetadataItemsTable };
export type { MetadataItem };
