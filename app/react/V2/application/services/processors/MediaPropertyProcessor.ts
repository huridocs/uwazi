import { FilePropertyTypes, MediaMetadataProperty, Timelink } from 'app/V2/domain/entities/types';
import { reportErrorToSentry } from 'app/V2/shared/errorUtils';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class MediaPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'MediaPropertyProcessor';

  readonly propertyTypes: FilePropertyTypes[] = ['media'];

  processBatch(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext
  ): AdapterMetadataProperty[] {
    const results: AdapterMetadataProperty[] = [];

    properties.forEach(property => {
      try {
        const values = this.processMediaFiles(property.value[0].value, context);
        results.push(Object.assign(property, { values }));
      } catch (error) {
        reportErrorToSentry(
          error as Error,
          `Error processing ${this.name} property ${property.name}`
        );
      }
    });

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MediaMetadataProperty['values'] {
    return this.processMediaFiles(property.value[0].value, context);
  }

  private processMediaFiles(
    url: PropertyValueSchema,
    context: ProcessingContext
  ): MediaMetadataProperty['values'] {
    if (typeof url === 'string' && url.startsWith('(')) {
      const match = url.match(/^\(([^,]+),\s*({.*})\)$/);
      if (match) {
        const fileUrl = match[1];
        const timelinksData = JSON.parse(match[2]);
        const timelinks = this.processTimelines(timelinksData.timelinks, context);
        const fileName = fileUrl.split('/').pop() || 'Unknown file';

        return [
          {
            value: fileUrl,
            alt: fileName,
            mimetype: this.getMimetypeFromUrl(fileUrl),
            fileType: this.getFileType(this.getMimetypeFromUrl(fileUrl)),
            timelinks: timelinks || {},
          },
        ];
      }
    }
    return [
      {
        value: url?.toString() || '',
        timelinks: [],
      },
    ];
  }

  private processTimelines(
    timelines: { [key: string]: string },
    _context: ProcessingContext
  ): Timelink[] {
    return Object.entries(timelines).map(([time, label]) => {
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
