import React, { useEffect, useState } from 'react';
import { addons, types, useStorybookApi } from 'storybook/manager-api';
import {
  STORYBOOK_A11Y_ADDON_ID,
  STORYBOOK_A11Y_EVENT,
  STORYBOOK_A11Y_PANEL_ID,
} from './a11yConstants.js';

const TOOL_ID = `${STORYBOOK_A11Y_ADDON_ID}/tool`;

type StorybookA11yCheck = {
  id: string;
  label: string;
  ratio: number;
  passesAA: boolean;
};

type StorybookA11yPayload = {
  preset: 'default' | 'legacy';
  mode: 'light' | 'dark';
  checks: StorybookA11yCheck[];
};

const Tool = () => {
  const api = useStorybookApi();
  const [payload, setPayload] = useState<StorybookA11yPayload>({
    preset: 'default',
    mode: 'light',
    checks: [],
  });

  useEffect(() => {
    const channel = addons.getChannel();
    const handler = (nextPayload: StorybookA11yPayload) => setPayload(nextPayload);
    channel.on(STORYBOOK_A11Y_EVENT, handler);
    return () => {
      channel.off(STORYBOOK_A11Y_EVENT, handler);
    };
  }, []);

  const checks = payload.checks;
  const hasChecks = checks.length > 0;
  const failedChecks = checks.filter(check => !check.passesAA);
  const passes = failedChecks.length === 0;

  return (
    <button
      type="button"
      onClick={() => {
        api.setSelectedPanel(STORYBOOK_A11Y_PANEL_ID);
        api.togglePanel(true);
      }}
      title={
        !hasChecks
          ? 'No accessibility checks apply to this story'
          : passes
          ? `Accessibility checks passing (${payload.preset} ${payload.mode})`
          : `${failedChecks.length} accessibility checks failing`
      }
      style={{
        border: !hasChecks ? '1px solid #d1d5db' : passes ? '1px solid #bbf7d0' : '1px solid #fecaca',
        background: !hasChecks ? '#f9fafb' : passes ? '#f0fdf4' : '#fef2f2',
        color: !hasChecks ? '#4b5563' : passes ? '#166534' : '#b91c1c',
        borderRadius: 6,
        height: 28,
        padding: '0 10px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {!hasChecks ? 'A11y N/A' : passes ? 'A11y Pass' : `A11y Fail (${failedChecks.length})`}
    </button>
  );
};

const Panel = ({ active }: { active: boolean }) => {
  const [payload, setPayload] = useState<StorybookA11yPayload>({
    preset: 'default',
    mode: 'light',
    checks: [],
  });

  useEffect(() => {
    const channel = addons.getChannel();
    const handler = (nextPayload: StorybookA11yPayload) => setPayload(nextPayload);
    channel.on(STORYBOOK_A11Y_EVENT, handler);
    return () => {
      channel.off(STORYBOOK_A11Y_EVENT, handler);
    };
  }, []);

  if (!active) return null;

  return (
    <div style={{ padding: 16, background: '#ffffff', height: '100%', overflow: 'auto' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        {payload.checks.length > 0 ? 'Accessibility checks' : 'No applicable accessibility checks'}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        {payload.preset} theme, {payload.mode} mode
      </div>
      {payload.checks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payload.checks.map(check => (
            <div
              key={check.id}
              style={{
                borderRadius: 8,
                border: `1px solid ${check.passesAA ? '#bbf7d0' : '#fecaca'}`,
                background: check.passesAA ? '#f0fdf4' : '#fef2f2',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#111827',
                }}
              >
                <span>{check.label}</span>
                <strong>{check.ratio.toFixed(1)}:1</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          This story does not expose any scoped theme diagnostics or detectable interactive elements to
          validate.
        </div>
      )}
    </div>
  );
};

addons.register(STORYBOOK_A11Y_ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Accessibility',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: Tool,
  });
  addons.add(STORYBOOK_A11Y_PANEL_ID, {
    type: types.PANEL,
    title: 'A11y checks',
    render: Panel,
  });
});
