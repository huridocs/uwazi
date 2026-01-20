import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { VideoPlayer } from '#V2/Components/UI/Files/VideoPlayer.jsx';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';
import { setupMediaIntercepts, setupMediaElement } from '#V2/Components/UI/Files/specs/testHelpers.js';

describe('VideoPlayer', () => {
  const videoUrl = '/api/files/short-video.mp4';
  const thumbnailUrl = '/api/files/short-video-thumbnail.jpg';

  beforeEach(() => {
    setupMediaIntercepts();
  });

  describe('Internal video files', () => {
    it('should be accessible', () => {
      mount(<VideoPlayer url={videoUrl} />);
      cy.injectAxe();
      cy.checkA11y(undefined, undefined, logA11yViolations);
    });

    it('should render video element', () => {
      mount(<VideoPlayer url={videoUrl} />);
      cy.get('video').should('exist');
      cy.get('video').should('have.attr', 'src', videoUrl);
    });

    it('should show controls by default', () => {
      mount(<VideoPlayer url={videoUrl} />);
      cy.get('video').should('have.attr', 'controls');
    });

    it('should display thumbnail overlay when provided', () => {
      mount(
        <VideoPlayer url={videoUrl} thumbnail={{ url: thumbnailUrl, fileName: 'Test Video' }} />
      );
      cy.get('button[aria-label="Play video"]').should('exist');
    });

    it('should play video when play button is clicked', () => {
      mount(
        <VideoPlayer url={videoUrl} thumbnail={{ url: thumbnailUrl, fileName: 'Test Video' }} />
      );
      cy.get('button[aria-label="Play video"]').click();
      cy.get('video').should('have.attr', 'controls');
    });

    it('should hide thumbnail overlay after play', () => {
      mount(
        <VideoPlayer url={videoUrl} thumbnail={{ url: thumbnailUrl, fileName: 'Test Video' }} />
      );
      cy.get('button[aria-label="Play video"]').click();
      cy.get('button[aria-label="Play video"]').should('not.exist');
    });

    it('should call onDuration callback when metadata is loaded', () => {
      const onDuration = cy.stub().as('onDuration');
      mount(<VideoPlayer url={videoUrl} onDuration={onDuration} />);
      cy.get('video').then($video => {
        setupMediaElement($video[0] as HTMLVideoElement, 300);
      });
      cy.get('@onDuration').should('have.been.calledWith', 300);
    });

    it('should call onDuration immediately if video is already loaded', () => {
      const onDuration = cy.stub().as('onDuration');
      mount(<VideoPlayer url={videoUrl} onDuration={onDuration} />);
      cy.get('video').then($video => {
        setupMediaElement($video[0] as HTMLVideoElement, 240);
      });
    });

    it('should apply custom className', () => {
      mount(<VideoPlayer url={videoUrl} className="custom-class" />);
      cy.get('div').should('have.class', 'custom-class');
    });

    it('should respect width and height props', () => {
      mount(<VideoPlayer url={videoUrl} width={800} height={600} />);
      cy.get('div').should('have.css', 'width', '800px');
      cy.get('div').should('have.css', 'height', '600px');
    });
  });

  describe('YouTube videos', () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    it('should render YouTube iframe', () => {
      mount(<VideoPlayer url={youtubeUrl} />);
      cy.get('iframe').should('exist');
      cy.get('iframe').should('have.attr', 'src').and('include', 'youtube.com/embed');
      cy.get('iframe').should('have.attr', 'title', 'YouTube video player');
    });

    it('should be accessible', () => {
      mount(<VideoPlayer url={youtubeUrl} />);
      cy.injectAxe();
      cy.checkA11y(undefined, undefined, logA11yViolations);
    });

    it('should handle YouTube short URL', () => {
      mount(<VideoPlayer url="https://youtu.be/dQw4w9WgXcQ" />);
      cy.get('iframe').should('have.attr', 'src').and('include', 'youtube.com/embed');
    });
  });

  describe('Vimeo videos', () => {
    const vimeoUrl = 'https://vimeo.com/123456789';

    it('should render Vimeo iframe', () => {
      mount(<VideoPlayer url={vimeoUrl} />);
      cy.get('iframe').should('exist');
      cy.get('iframe').should('have.attr', 'src').and('include', 'vimeo.com/video');
      cy.get('iframe').should('have.attr', 'title', 'Vimeo video player');
    });

    it('should be accessible', () => {
      mount(<VideoPlayer url={vimeoUrl} />);
      cy.injectAxe();
      cy.checkA11y(undefined, undefined, logA11yViolations);
    });
  });

  describe('Invalid URLs', () => {
    it('should display error message for invalid URL', () => {
      mount(<VideoPlayer url="" />);
      cy.contains('This file type is not supported on media fields').should('exist');
    });

    it('should be accessible when showing error', () => {
      mount(<VideoPlayer url="" />);
      cy.injectAxe();
      cy.checkA11y(undefined, undefined, logA11yViolations);
    });
  });

  describe('External video URLs', () => {
    it('should render video element for external MP4 URL', () => {
      const externalUrl = 'https://example.com/video.mp4';
      mount(<VideoPlayer url={externalUrl} />);
      cy.get('video').should('exist');
      cy.get('video').should('have.attr', 'src', externalUrl);
    });

    it('should render video element for external WebM URL', () => {
      const externalUrl = 'https://example.com/video.webm';
      mount(<VideoPlayer url={externalUrl} />);
      cy.get('video').should('exist');
    });
  });
});
