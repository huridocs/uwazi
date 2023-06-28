import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Paginator.stories';

const { Basic } = composeStories(stories);

describe('Paginator', () => {
  it('should render with the current page and the correct basic links', () => {
    mount(<Basic currentPage="5" totalPages="25" buildUrl={page => `path?page=${page}`} />);
    cy.get('a').eq(0).should('have.attr', 'href', '/path?page=4');
    cy.get('a').eq(1).should('have.attr', 'href', '/path?page=1');
    cy.get('a').eq(2).should('have.attr', 'href', '/path?page=4');
    cy.get('a').eq(3).should('have.attr', 'href', '/path?page=5');
    cy.get('a').eq(4).should('have.attr', 'href', '/path?page=6');
    cy.get('a').eq(5).should('have.attr', 'href', '/path?page=25');
    cy.get('a').eq(6).should('have.attr', 'href', '/path?page=6');
    cy.contains('button', 'Show more').should('exist');
  });

  it('should render a disabled button for the previous/next arrow if on first/last page', () => {
    mount(<Basic currentPage="1" totalPages="25" buildUrl={page => `path?page=${page}`} />);
    cy.get('a').eq(0).should('have.attr', 'href', '/path?page=1');
    cy.get('button').eq(0).should('have.attr', 'disabled');

    mount(<Basic currentPage="25" totalPages="25" buildUrl={page => `path?page=${page}`} />);
    cy.get('a').eq(3).should('have.attr', 'href', '/path?page=25');
    cy.get('button').should('have.attr', 'disabled');
  });

  it('should not show the link to first page if on fist page', () => {
    mount(<Basic currentPage="1" totalPages="25" buildUrl={page => `path?page=${page}`} />);
    cy.get('a').eq(0).should('have.attr', 'href', '/path?page=1');
    cy.get('a').eq(1).should('have.attr', 'href', '/path?page=2');
  });

  it('should not show the link to last page if on last page', () => {
    mount(<Basic currentPage="25" totalPages="25" buildUrl={page => `path?page=${page}`} />);
    cy.get('a').eq(0).should('have.attr', 'href', '/path?page=24');
    cy.get('a').eq(1).should('have.attr', 'href', '/path?page=1');
    cy.get('a').eq(2).should('have.attr', 'href', '/path?page=24');
    cy.get('a').eq(3).should('have.attr', 'href', '/path?page=25');
  });

  describe('current page siblings', () => {
    it('should show not show them if they are the same as the first or last page', () => {
      mount(<Basic currentPage="2" totalPages="25" buildUrl={page => `path?page=${page}`} />);
      cy.get('a').eq(0).should('have.attr', 'href', '/path?page=1');
      cy.get('a').eq(1).should('have.attr', 'href', '/path?page=1');
      cy.get('a').eq(2).should('have.attr', 'href', '/path?page=2');

      mount(<Basic currentPage="24" totalPages="25" buildUrl={page => `path?page=${page}`} />);
      cy.get('a').eq(3).should('have.attr', 'href', '/path?page=24');
      cy.get('a').eq(4).should('have.attr', 'href', '/path?page=25');
      cy.get('a').eq(5).should('have.attr', 'href', '/path?page=25');
    });
  });

  describe('show more', () => {
    it('should show more pages', () => {
      mount(<Basic currentPage="5" totalPages="25" buildUrl={page => `path?page=${page}`} />);
      cy.contains('button', 'Show more').click();
      cy.get('a').eq(3).should('have.attr', 'href', '/path?page=5');
      cy.get('a').eq(4).should('have.attr', 'href', '/path?page=6');
      cy.get('a').eq(5).should('have.attr', 'href', '/path?page=7');
      cy.get('a').eq(6).should('have.attr', 'href', '/path?page=8');
      cy.get('a').eq(7).should('have.attr', 'href', '/path?page=9');
      cy.get('a').eq(8).should('have.attr', 'href', '/path?page=10');
      cy.get('a').eq(9).should('have.attr', 'href', '/path?page=11');
      cy.get('a').eq(10).should('have.attr', 'href', '/path?page=25');
    });

    it('should not show more pages button if there are none', () => {
      mount(<Basic currentPage="2" totalPages="3" buildUrl={page => `path?page=${page}`} />);
      cy.contains('button', 'Show more').should('not.exist');
      cy.get('a').eq(0).should('have.attr', 'href', '/path?page=1');
      cy.get('a').eq(1).should('have.attr', 'href', '/path?page=1');
      cy.get('a').eq(2).should('have.attr', 'href', '/path?page=2');
      cy.get('a').eq(3).should('have.attr', 'href', '/path?page=3');
      cy.get('a').eq(4).should('have.attr', 'href', '/path?page=3');
    });

    it('should not show more pages button if it is unnecessary', () => {
      mount(<Basic currentPage="2" totalPages="7" buildUrl={page => `path?page=${page}`} />);
      cy.contains('button', 'Show more').should('not.exist');

      mount(<Basic currentPage="1" totalPages="3" buildUrl={page => `path?page=${page}`} />);
      cy.contains('button', 'Show more').should('not.exist');

      mount(<Basic currentPage="5" totalPages="5" buildUrl={page => `path?page=${page}`} />);
      cy.contains('button', 'Show more').should('not.exist');
    });
  });
});
