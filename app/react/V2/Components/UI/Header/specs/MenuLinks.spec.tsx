/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MenuLinks } from '../MenuLinks.js';

describe('MenuLinks', () => {
  it('omits links until the row has been measured', () => {
    const html = renderToString(
      <MenuLinks
        links={[
          { title: 'About', url: '/about', type: 'link' },
          { title: 'Methodology', url: '/methodology', type: 'link' },
        ]}
      />
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('href="/about"');
    expect(html).not.toContain('href="/methodology"');
  });
});
