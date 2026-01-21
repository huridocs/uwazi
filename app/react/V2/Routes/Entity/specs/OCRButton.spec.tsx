/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { socket } from '#app/socket.js';
import { TestRouterContext } from '#V2/testing/index.js';
import * as files from '#V2/api/files/index.js';
import { OCRButton } from '#V2/Routes/Entity/Components/OCRButton.jsx';

describe('OCRButton', () => {
  const file = { _id: 'file1', filename: 'file.pdf', language: 'en' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders OCR PDF when the document has no OCR and triggers OCR on click', async () => {
    jest.spyOn(files, 'getOcrStatus').mockResolvedValue({ status: files.OcrStatus.NONE });
    const postMock = jest.spyOn(files, 'postToOcr').mockResolvedValue({ status: 200 });

    render(
      <TestRouterContext>
        <OCRButton file={file} />
      </TestRouterContext>
    );

    const button = (await screen.findByText('OCR PDF')).closest('button');
    expect(button).toBeEnabled();

    fireEvent.click(button!);

    await waitFor(() => {
      expect(screen.getByText('In OCR queue').closest('button')).toBeInTheDocument();
      expect(screen.getByText('In OCR queue').closest('button')).toBeDisabled();
    });

    expect(postMock).toHaveBeenCalledWith('file.pdf');
  });

  it('listens for OCR success and updates the UI to READY', async () => {
    jest.spyOn(files, 'getOcrStatus').mockResolvedValue({ status: files.OcrStatus.PROCESSING });

    const callbackSpy: Record<string, any> = {};
    jest.spyOn(socket, 'on').mockImplementation((event: string, cb: any) => {
      callbackSpy[event] = cb;
    });

    render(
      <TestRouterContext>
        <OCRButton file={file} />
      </TestRouterContext>
    );

    await waitFor(() => expect(files.getOcrStatus).toHaveBeenCalledWith('file.pdf'));

    await waitFor(() => {
      callbackSpy['ocr:ready'](file._id);
    });

    await waitFor(() => {
      expect(screen.getByText('OCR').closest('button')).toBeDisabled();
    });
  });

  it('listens for OCR error and shows error state', async () => {
    jest
      .spyOn(files, 'getOcrStatus')
      .mockResolvedValue({ status: files.OcrStatus.PROCESSING } as any);

    const listeners: Record<string, any> = {};
    jest.spyOn(socket, 'on').mockImplementation((event: string, cb: any) => {
      listeners[event] = cb;
    });

    render(
      <TestRouterContext>
        <OCRButton file={file} />
      </TestRouterContext>
    );

    await waitFor(() => expect(files.getOcrStatus).toHaveBeenCalledWith('file.pdf'));

    await waitFor(() => {
      listeners['ocr:error'](file._id);
    });

    await waitFor(() => {
      expect(screen.getByText('OCR error').closest('button')).toBeDisabled();
    });
  });
});
