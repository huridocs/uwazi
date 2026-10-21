/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { RenderIfVisible } from '../RenderIfVisible.js';

describe('RenderIfVisible server render', () => {
  it('renders a placeholder instead of the children', () => {
    const html = renderToString(
      <RenderIfVisible defaultHeight={140}>
        <span>Server child</span>
      </RenderIfVisible>
    );
    expect(html).not.toContain('Server child');
    expect(html).toContain('renderIfVisible-placeholder');
    expect(html).toContain('height:140px');
  });

  it('renders children marked initially visible', () => {
    const html = renderToString(
      <RenderIfVisible initialVisible defaultHeight={140}>
        <span>Eager server child</span>
      </RenderIfVisible>
    );
    expect(html).toContain('Eager server child');
  });
});
