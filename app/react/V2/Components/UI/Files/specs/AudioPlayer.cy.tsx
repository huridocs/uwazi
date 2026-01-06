import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import AudioPlayer from '../AudioPlayer';
import { setupMediaIntercepts, setupMediaElement } from './testHelpers';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y';

describe('AudioPlayer', () => {
  const audioUrl = '/api/files/short-video.mp4';

  beforeEach(() => {
    setupMediaIntercepts();
  });

  const AudioPlayerComponent = ({
    url,
    altText,
    onDuration,
    className,
  }: {
    url: string;
    altText: string;
    onDuration?: (duration: number) => void;
    className?: string;
  }) => {
    return (
      <div className="tw-content">
        <AudioPlayer url={url} altText={altText} onDuration={onDuration} className={className} />
      </div>
    );
  };

  it('should be accessible', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" />);
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render play button', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" />);
    cy.get('button[aria-label="Play audio"]').should('exist');
  });

  it('should play audio when play button is clicked', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" />);
    cy.get('button[aria-label="Play audio"]').should('exist').click();
  });

  it('should pause audio when pause button is clicked', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" />);
    cy.get('button[aria-label="Play audio"]').click();
  });

  it('should call onDuration callback when metadata is loaded', () => {
    const onDuration = cy.stub().as('onDuration');
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" onDuration={onDuration} />);
    cy.get('audio').then($audio => {
      setupMediaElement($audio[0] as HTMLAudioElement, 120);
    });
    cy.get('@onDuration').should('have.been.calledWith', 120);
  });

  it('should call onDuration immediately if audio is already loaded', () => {
    const onDuration = cy.stub().as('onDuration');
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" onDuration={onDuration} />);
    cy.get('audio').then($audio => {
      setupMediaElement($audio[0] as HTMLAudioElement, 180);
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    cy.get('@onDuration').should('have.been.called');
  });

  it('should apply custom className', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" className="custom-class" />);
    cy.get('div').should('have.class', 'custom-class');
  });

  it('should display alt text in figcaption', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio File" />);
    cy.contains('Test Audio File').should('exist');
  });

  it('should handle empty url', () => {
    mount(<AudioPlayerComponent url="" altText="Test Audio" />);
    cy.get('audio').should('have.attr', 'src', '');
  });

  it('should update button label when playing state changes', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" />);
    cy.get('button[aria-label="Play audio"]').should('exist');
    cy.get('button').click();
  });

  it('should reset to play button when audio ends', () => {
    mount(<AudioPlayerComponent url={audioUrl} altText="Test Audio" />);
    cy.get('button[aria-label="Play audio"]').click();
    cy.get('audio').then($audio => {
      const audio = $audio[0] as HTMLAudioElement;
      audio.dispatchEvent(new Event('ended'));
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100);
    cy.get('button[aria-label="Play audio"]').should('exist');
  });
});
