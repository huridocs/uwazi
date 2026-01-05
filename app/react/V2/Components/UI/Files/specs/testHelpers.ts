/// <reference types="cypress" />
import { EntityFile } from '../FileCard';

export const mockImageFile: EntityFile = {
  _id: 'file1',
  filename: 'test-image.jpg',
  originalname: 'Test Image.jpg',
  mimetype: 'image/jpeg',
  size: 512000,
  url: '/api/files/test-image.jpg',
  fileType: 'image',
};

export const mockPdfFile: EntityFile = {
  _id: 'file2',
  filename: 'test-document.pdf',
  originalname: 'Test Document.pdf',
  mimetype: 'application/pdf',
  size: 1048576,
  url: '/api/files/test-document.pdf',
  fileType: 'document',
};

export const mockAudioFile: EntityFile = {
  _id: 'file3',
  filename: 'test-audio.mp3',
  originalname: 'Test Audio.mp3',
  mimetype: 'audio/mpeg',
  size: 2048000,
  url: '/api/files/test-audio.mp3',
  fileType: 'media',
  duration: 120,
};

export const mockVideoFile: EntityFile = {
  _id: 'file4',
  filename: 'test-video.mp4',
  originalname: 'Test Video.mp4',
  mimetype: 'video/mp4',
  size: 3072000,
  url: '/api/files/test-video.mp4',
  fileType: 'media',
};

export const setupMediaIntercepts = () => {
  cy.intercept('GET', '/api/files/test-audio.mp3', {
    statusCode: 200,
    body: 'mock audio content',
    headers: { 'Content-Type': 'audio/mpeg' },
  }).as('getAudio');

  cy.intercept('GET', '/api/files/test-video.mp4', {
    statusCode: 200,
    body: 'mock video content',
    headers: { 'Content-Type': 'video/mp4' },
  }).as('getVideo');

  cy.intercept('GET', '/api/files/test-thumbnail.jpg', {
    statusCode: 200,
    body: 'mock thumbnail',
    headers: { 'Content-Type': 'image/jpeg' },
  }).as('getThumbnail');
};

export const setupMediaElement = (
  element: HTMLAudioElement | HTMLVideoElement,
  duration: number
) => {
  Object.defineProperty(element, 'duration', { value: duration, writable: true });
  Object.defineProperty(element, 'readyState', { value: 4, writable: true });
  element.dispatchEvent(new Event('loadedmetadata'));
};
