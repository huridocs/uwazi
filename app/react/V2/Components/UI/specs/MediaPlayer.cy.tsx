import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/MediaPlayer.stories';

const { LocalFile, LocalFileWithThumbnail, InvalidMedia } = composeStories(stories);

describe('Media player', () => {
  before(() => {
    cy.injectAxe();
  });

  describe('Local files', () => {
    beforeEach(() => {
      mount(<LocalFile />);
    });

    it('should be accessible', () => {
      cy.checkA11y();
    });

    it('should display a generic thumbnail with the title of the video', () => {
      cy.contains('p', 'Short video');
    });

    it('should request the video and render the player when clicking', () => {
      cy.intercept('GET', '/short-video.mp4', req => {
        req.reply({
          statusCode: 200,
          body: 'mock video content',
          headers: {
            'Content-Type': 'video/mp4',
          },
        });
      }).as('getVideo');

      cy.get('.react-player__preview').click();
      cy.get('video').should('have.attr', 'src', '/short-video.mp4');
    });
  });

  describe('Local file with image thumbnail', () => {
    beforeEach(() => {
      cy.intercept('GET', '/short-video-thumbnail.jpg', req => {
        req.reply({
          statusCode: 200,
          body: 'mock video thumbnail',
          headers: {
            'Content-Type': 'image/jpg',
          },
        });
      }).as('getThumbnail');

      mount(<LocalFileWithThumbnail />);
    });

    it('should be accessible', () => {
      cy.checkA11y();
    });

    it('should have the thumbnail as background', () => {
      cy.get('.react-player__preview').should(
        'have.css',
        'background-image',
        'url("http://localhost:8080/short-video-thumbnail.jpg")'
      );
    });

    it('should request the video and render the player when clicking', () => {
      cy.intercept('GET', '/short-video.mp4', req => {
        req.reply({
          statusCode: 200,
          body: 'mock video content',
          headers: {
            'Content-Type': 'video/mp4',
          },
        });
      }).as('getVideo');

      cy.get('.react-player__preview').click();
      cy.get('video').should('have.attr', 'src', '/short-video.mp4');
    });
  });

  describe('Invalid media', () => {
    it('should display an accessible error message', () => {
      cy.intercept('GET', '/sample.pdf', req => {
        req.reply({
          statusCode: 200,
          body: 'an incorect file for media fields',
          headers: {
            'Content-Type': 'application/pdf',
          },
        });
      }).as('getVideo');

      mount(<InvalidMedia />);

      cy.contains('This file type is not supported on media fields');

      cy.checkA11y();
    });
  });
});
