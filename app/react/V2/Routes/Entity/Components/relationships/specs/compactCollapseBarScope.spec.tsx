/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  CompactCollapseBarProvider,
  useCompactCollapseBarMounted,
  useRetainCompactCollapseBar,
} from '../panel/compactCollapseBarScope.js';

const Probe = ({ active, label }: { active: boolean; label: string }) => {
  useRetainCompactCollapseBar(active);
  const mounted = useCompactCollapseBarMounted();
  return <span>{`${label}:${mounted ? 'hidden' : 'shown'}`}</span>;
};

describe('compact collapse bar scope', () => {
  it('hides list controls only inside the entity that mounted the compact bar', () => {
    render(
      <>
        <CompactCollapseBarProvider>
          <Probe active label="library" />
        </CompactCollapseBarProvider>
        <CompactCollapseBarProvider>
          <Probe active={false} label="overlay" />
        </CompactCollapseBarProvider>
      </>
    );

    expect(screen.getByText('library:hidden')).toBeInTheDocument();
    expect(screen.getByText('overlay:shown')).toBeInTheDocument();
  });
});
