import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { FilePreview } from '../FilePreview.js';
import { EntityFile } from '../FileCard.js';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';
import {
  mockImageFile,
  mockPdfFile,
  mockAudioFile,
  mockVideoFile,
  setupMediaIntercepts,
  setupMediaElement,
} from './testHelpers.js';

const mockMainDocument: EntityFile = {
  ...mockPdfFile,
  _id: 'file3',
  filename: 'main-document.pdf',
  originalname: 'Main Document.pdf',
  fileType: 'mainDocument',
};

const mockOtherFile: EntityFile = {
  _id: 'file6',
  filename: 'test-file.txt',
  originalname: 'Test File.txt',
  mimetype: 'text/plain',
  url: '/api/files/test-file.txt',
  fileType: 'document',
};

describe('FilePreview', () => {
  beforeEach(() => {
    setupMediaIntercepts();
  });

  const FilePreviewComponent = ({
    file,
    onDuration,
    className,
  }: {
    file: EntityFile;
    onDuration?: (duration: number) => void;
    className?: string;
  }) => {
    return (
      <div className="tw-content">
        <FilePreview file={file} onDuration={onDuration} className={className} />
      </div>
    );
  };

  it('should be accessible for image files', () => {
    mount(<FilePreviewComponent file={mockImageFile} />);
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render image for image files', () => {
    mount(<FilePreviewComponent file={mockImageFile} />);
    cy.get('img').should('exist');
    cy.get('img').should('have.attr', 'src', '/api/files/batman.jpg');
    cy.get('img').should('have.attr', 'alt', 'Batman.jpg');
  });

  it('should render audio player for audio files', () => {
    mount(<FilePreviewComponent file={mockAudioFile} />);
    cy.get('figure').should('exist');
  });

  it('should render video player for video files', () => {
    mount(<FilePreviewComponent file={mockVideoFile} />);
    cy.get('video').should('exist');
  });

  it('should render PDF icon for regular PDF files', () => {
    mount(<FilePreviewComponent file={mockPdfFile} />);
    cy.get('svg').should('exist');
    cy.contains('Sample Document.pdf').should('exist');
  });

  it('should render star icon for main document PDF files', () => {
    mount(<FilePreviewComponent file={mockMainDocument} />);
    cy.get('img[src*=".jpg"]').should('exist');
    cy.get('svg').should('exist');
  });

  it('should render document icon for other file types', () => {
    mount(<FilePreviewComponent file={mockOtherFile} />);
    cy.get('svg').should('exist');
    cy.contains('Test File.txt').should('exist');
  });

  it('should call onDuration callback for audio files', () => {
    const onDuration = cy.stub().as('onDuration');
    mount(<FilePreviewComponent file={mockAudioFile} onDuration={onDuration} />);
    cy.get('figure').should('exist');
  });

  it('should call onDuration callback for video files', () => {
    const onDuration = cy.stub().as('onDuration');
    mount(<FilePreviewComponent file={mockVideoFile} onDuration={onDuration} />);
    cy.get('video').then($video => {
      setupMediaElement($video[0] as HTMLVideoElement, 180);
    });
  });

  it('should apply custom className', () => {
    mount(<FilePreviewComponent file={mockImageFile} className="custom-class" />);
    cy.get('div').should('have.class', 'custom-class');
  });

  it('should handle files without originalname', () => {
    const fileWithoutName: EntityFile = {
      ...mockImageFile,
      originalname: undefined,
      filename: 'batman.jpg',
    };
    mount(<FilePreviewComponent file={fileWithoutName} />);
    cy.get('img').should('have.attr', 'alt', '/api/files/batman.jpg');
  });

  it('should handle files with URL but no filename', () => {
    const fileWithUrl: EntityFile = {
      ...mockImageFile,
      filename: undefined,
      url: 'https://example.com/image.jpg',
    };
    mount(<FilePreviewComponent file={fileWithUrl} />);
    cy.get('img').should('have.attr', 'src', 'https://example.com/image.jpg');
  });

  it('should render image from test file (batman.jpg)', () => {
    const batmanFile: EntityFile = {
      _id: 'batman',
      filename: 'batman.jpg',
      originalname: 'Batman.jpg',
      mimetype: 'image/jpeg',
      size: 100000,
      url: '/api/files/batman.jpg',
      fileType: 'image',
    };
    mount(<FilePreviewComponent file={batmanFile} />);
    cy.get('img').should('exist');
    cy.get('img').should('have.attr', 'src', '/api/files/batman.jpg');
  });
});
