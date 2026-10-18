import { fileDownloadHeaders } from '../fileDownloadHeaders.js';

describe('fileDownloadHeaders', () => {
  it('should mark ordinary files inline and keep their media type', () => {
    const headers = fileDownloadHeaders({
      storedFilename: '123.pdf',
      originalFilename: 'report.pdf',
      mimetype: 'application/pdf',
    });

    expect(headers.contentDisposition).toBe("inline; filename*=UTF-8''report.pdf");
    expect(headers.contentType).toBe('application/pdf');
    expect(headers.contentSecurityPolicy).toBeUndefined();
  });

  it('should force a download when the client asks for one', () => {
    const headers = fileDownloadHeaders({
      storedFilename: '123.pdf',
      originalFilename: 'report.pdf',
      mimetype: 'application/pdf',
      download: true,
    });

    expect(headers.contentDisposition).toBe("attachment; filename*=UTF-8''report.pdf");
    expect(headers.contentType).toBe('application/pdf');
  });

  it('should download HTML as an opaque file so the browser does not render it', () => {
    const headers = fileDownloadHeaders({
      storedFilename: '123.html',
      originalFilename: 'page.html',
      mimetype: 'text/html',
    });

    expect(headers.contentDisposition).toBe("attachment; filename*=UTF-8''page.html");
    expect(headers.contentType).toBe('application/octet-stream');
    expect(headers.contentSecurityPolicy).toContain('sandbox');
    expect(headers.contentSecurityPolicy).toContain("script-src 'none'");
  });

  it('should treat a stored html extension as active even when the media type is a document', () => {
    const headers = fileDownloadHeaders({
      storedFilename: '123.html',
      originalFilename: 'notes.pdf',
      mimetype: 'application/pdf',
    });

    expect(headers.contentDisposition.startsWith('attachment;')).toBe(true);
    expect(headers.contentType).toBe('application/octet-stream');
  });

  it('should keep SVG images renderable and stop them executing script', () => {
    const headers = fileDownloadHeaders({
      storedFilename: '123.svg',
      originalFilename: 'logo.svg',
      mimetype: 'image/svg+xml',
    });

    expect(headers.contentDisposition).toBe("attachment; filename*=UTF-8''logo.svg");
    expect(headers.contentType).toBe('image/svg+xml');
    expect(headers.contentSecurityPolicy).toContain('sandbox');
    expect(headers.contentSecurityPolicy).toContain("script-src 'none'");
  });

  it('should encode header-breaking characters in the download name', () => {
    const headers = fileDownloadHeaders({
      storedFilename: '123.pdf',
      originalFilename: 'a\r\nb.pdf',
      mimetype: 'application/pdf',
    });

    expect(headers.contentDisposition.includes('\r')).toBe(false);
    expect(headers.contentDisposition.includes('\n')).toBe(false);
    expect(headers.contentDisposition).toContain(encodeURIComponent('a\r\nb.pdf'));
  });
});
