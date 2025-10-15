import { FilePropertyTypes, MediaMetadataProperty, Timelink } from 'app/V2/domain/entities/types';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class MediaPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'MediaPropertyProcessor';

  readonly propertyTypes: FilePropertyTypes[] = ['media'];

  processBatch(
    properties: any[],
    context: ProcessingContext
  ): Map<string, AdapterMetadataProperty> {
    const results = new Map<string, AdapterMetadataProperty>();

    properties.forEach(property => {
      try {
        const values = this.processMediaFiles(
          property.value as MediaMetadataProperty['values'],
          context
        );
        this.pushProperty(property as AdapterMetadataProperty, values, results);
      } catch (error) {
        console.error(`Error processing media property ${property._fieldName}:`, error);
      }
    });

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MediaMetadataProperty['values'] {
    return this.processMediaFiles(property.value as MediaMetadataProperty['values'], context);
  }

  private processMediaFiles(
    mediaFiles: MediaMetadataProperty['values'],
    context: ProcessingContext
  ): MediaMetadataProperty['values'] {
    return mediaFiles.map(file => {
      if (typeof file.value === 'string' && file.value.startsWith('(')) {
        try {
          const match = file.value.match(/^\(([^,]+),\s*({.*})\)$/);
          if (match) {
            const fileUrl = match[1];
            const timelinksData = JSON.parse(match[2]);
            const timelinks = this.processTimelines(timelinksData.timelinks, context);
            const fileName = fileUrl.split('/').pop() || 'Unknown file';

            return {
              value: fileUrl,
              alt: fileName,
              mimetype: this.getMimetypeFromUrl(fileUrl),
              fileType: this.getFileType(this.getMimetypeFromUrl(fileUrl)),
              timelinks: timelinks || {},
            };
          }
        } catch (error) {
          return {
            value: file.value,
          };
        }
      }

      return {
        value: file.value,
        alt: file.alt,
        timelinks: file.timelinks,
        mimetype: file.mimetype,
        fileType: file.fileType,
      };
    });
  }

  private processTimelines(timelines: string, _context: ProcessingContext): Timelink[] {
    return timelines.split(',').map(timeline => {
      const [time, label] = timeline.split('":"').map(part => part.replace(/^"|"$/g, ''));
      const [hours, minutes, seconds] = time.split(':').map(Number);
      return {
        label,
        hh: hours,
        mm: minutes,
        ss: seconds,
        time: hours * 3600 + minutes * 60 + seconds,
      };
    });
  }

  private getFileType(mimetype: string): string {
    if (!mimetype) return 'unknown';

    const [type] = mimetype.split('/');
    return type === 'application' ? 'document' : type;
  }

  private getMimetypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}
