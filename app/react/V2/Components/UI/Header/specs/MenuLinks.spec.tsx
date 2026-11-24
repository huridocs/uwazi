/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { MenuLinks } from '../MenuLinks.js';

describe('MenuLinks', () => {
  it('keeps links in the server markup and clips the row until it is measured', () => {
    const html = renderToString(
      <MemoryRouter>
        <MenuLinks
          links={[
            { title: 'About', url: '/about', type: 'link' },
            { title: 'Methodology', url: '/methodology', type: 'link' },
          ]}
        />
      </MemoryRouter>
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/methodology"');
  });
});
