/// <reference types="cypress" />
import { EntityFile } from '../FileCard';

export const mockImageFile: EntityFile = {
  _id: 'file1',
  filename: 'batman.jpg',
  originalname: 'Batman.jpg',
  mimetype: 'image/jpeg',
  size: 512000,
  url: '/api/files/batman.jpg',
  fileType: 'image',
};

export const mockPdfFile: EntityFile = {
  _id: 'file2',
  filename: 'sample.pdf',
  originalname: 'Sample Document.pdf',
  mimetype: 'application/pdf',
  size: 1048576,
  url: '/api/files/sample.pdf',
  fileType: 'document',
};

export const mockVideoFile: EntityFile = {
  _id: 'file4',
  filename: 'short-video.mp4',
  originalname: 'Short Video.mp4',
  mimetype: 'video/mp4',
  size: 3072000,
  url: '/api/files/short-video.mp4',
  fileType: 'media',
};

export const mockAudioFile: EntityFile = {
  _id: 'file3',
  filename: 'short-video.mp4',
  originalname: 'Test Audio.mp3',
  mimetype: 'audio/mpeg',
  size: 2048000,
  url: '/api/files/short-video.mp4',
  fileType: 'media',
  duration: 120,
};

export const setupTestFileIntercept = (
  url: string,
  testFilePath: string,
  mimeType: string
): Cypress.Chainable => {
  return cy.readFile(testFilePath, 'base64').then(fileContent => {
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    cy.intercept('GET', url, {
      statusCode: 200,
      body: bytes.buffer,
      headers: { 'Content-Type': mimeType },
    });
  });
};

export const setupTestFileIntercepts = (): void => {
  setupTestFileIntercept('/api/files/batman.jpg', 'cypress/test_files/batman.jpg', 'image/jpeg');
  setupTestFileIntercept(
    '/api/files/sample.pdf',
    'cypress/test_files/sample.pdf',
    'application/pdf'
  );
  setupTestFileIntercept(
    '/api/files/short-video.mp4',
    'cypress/test_files/short-video.mp4',
    'video/mp4'
  );
  setupTestFileIntercept(
    '/api/files/short-video-thumbnail.jpg',
    'cypress/test_files/short-video-thumbnail.jpg',
    'image/jpeg'
  );
  setupTestFileIntercept('/api/files/valid.pdf', 'cypress/test_files/valid.pdf', 'application/pdf');
  setupTestFileIntercept(
    '/api/files/single_page.pdf',
    'cypress/test_files/single_page.pdf',
    'application/pdf'
  );
};

export const setupMediaIntercepts = setupTestFileIntercepts;

export const setupMediaElement = (
  element: HTMLAudioElement | HTMLVideoElement,
  duration: number
) => {
  Object.defineProperty(element, 'duration', { value: duration, writable: true });
  Object.defineProperty(element, 'readyState', { value: 4, writable: true });
  element.dispatchEvent(new Event('loadedmetadata'));
};
