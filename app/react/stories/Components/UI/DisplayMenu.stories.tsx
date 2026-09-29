import React, { useState } from 'react';
import preview from '#storybook/preview';
import {
  DisplayMenu,
  DisplayMenuCheckRow,
  DisplayMenuRow,
  WarmSelect,
} from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/UI/DisplayMenu',
  component: DisplayMenu,
});

const Preview = () => {
  const [groupBy, setGroupBy] = useState('relation-type');
  const [sort, setSort] = useState('appearance');
  const modified = groupBy !== 'relation-type' || sort !== 'appearance';

  return (
    <div className="tw-content flex justify-end p-8">
      <DisplayMenu ariaLabel="Display options" modified={modified}>
        <DisplayMenuRow label="Group by">
          <WarmSelect
            value={groupBy}
            onChange={setGroupBy}
            ariaLabel="Group by"
            align="end"
            options={[
              { value: 'none', label: 'None' },
              { value: 'relation-type', label: 'Relation type' },
              { value: 'target-template', label: 'Target template' },
            ]}
          />
        </DisplayMenuRow>
        <DisplayMenuRow label="Sort">
          <WarmSelect
            value={sort}
            onChange={setSort}
            ariaLabel="Sort"
            align="end"
            options={[
              { value: 'appearance', label: 'Appearance' },
              { value: 'asc', label: 'A → Z' },
              { value: 'desc', label: 'Z → A' },
            ]}
          />
        </DisplayMenuRow>
      </DisplayMenu>
    </div>
  );
};

const Default = meta.story({
  render: () => <Preview />,
});

const ColumnsAndDensity = meta.story({
  render: () => {
    const ColumnsPreview = () => {
      const [visible, setVisible] = useState({ title: true, template: true, country: false });
      const [density, setDensity] = useState<'comfortable' | 'compact'>('compact');
      return (
        <div className="tw-content flex justify-end p-8">
          <DisplayMenu ariaLabel="Display options" appearance="outlined">
            <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
              Columns
            </p>
            {Object.entries(visible).map(([id, checked]) => (
              <DisplayMenuCheckRow
                key={id}
                label={id}
                checked={checked}
                onToggle={() => setVisible(current => ({ ...current, [id]: !checked }))}
              />
            ))}
            <div className="my-1 h-px border-t border-border-soft" />
            <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
              Density
            </p>
            <DisplayMenuCheckRow
              label="Comfortable"
              description="Room around every row"
              checked={density === 'comfortable'}
              onToggle={() => setDensity('comfortable')}
            />
            <DisplayMenuCheckRow
              label="Compact"
              description="More rows per screen; same type size"
              checked={density === 'compact'}
              onToggle={() => setDensity('compact')}
            />
          </DisplayMenu>
        </div>
      );
    };
    return <ColumnsPreview />;
  },
});

export { Default, ColumnsAndDensity };
