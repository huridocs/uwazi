import { FilePropertyTypes } from 'app/V2/domain/entities/types';
import { MetadataProperty } from 'app/V2/domain/entities/types';
import {
  PropertyTypeProcessor,
  ProcessingContext,
  AdapterMetadataProperty,
} from './types';

export class MediaPropertyProcessor implements PropertyTypeProcessor {
  readonly name = 'MediaPropertyProcessor';

  readonly propertyTypes: FilePropertyTypes[] = ['media'];

  protected formatProperty(property: AdapterMetadataProperty, context: ProcessingContext): MetadataProperty["values"] {
    return this.processMediaFiles(property.value, context);
  }

  private processMediaFiles(files: Array<{
    value: string;
    fileName?: string;
    originalname?: string;
    label?: string;
    url?: string;
    mimetype?: string;
    size?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    thumbnail?: string;
    _id?: string;
    id?: string;
  }>, _context: ProcessingContext): MetadataProperty["values"] {
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map((file, index) => {
      if (typeof file.value === 'string' && file.value.startsWith('(')) {
        try {
          const match = file.value.match(/^\(([^,]+),\s*({.*})\)$/);
          if (match) {
            const fileUrl = match[1];
            const timelinksData = JSON.parse(match[2]);
            const fileName = fileUrl.split('/').pop() || 'Unknown file';

            return {
              value: fileUrl,
              label: fileName,
              url: fileUrl,
              mimetype: this.getMimetypeFromUrl(fileUrl),
              size: 0,
              duration: 0,
              dimensions: null,
              thumbnail: null,
              selected: true,
              filename: fileName,
              originalname: fileName,
              fileType: this.getFileType(this.getMimetypeFromUrl(fileUrl)),
              index,
              timelinks: timelinksData.timelinks || {},
            };
          }
        } catch (error) {
          console.error('Error parsing media file string:', error);
        }
      }

      return {
        value: file._id || file.id || file.value,
        label: file.originalname || file.fileName || file.label || 'Unknown file',
        url: file.url || `/api/files/${file._id || file.id || file.value}`,
        mimetype: file.mimetype,
        size: file.size || 0,
        duration: file.duration || 0,
        dimensions: file.dimensions,
        thumbnail: file.thumbnail,
        selected: true,
        filename: file.fileName,
        originalname: file.originalname,
        fileType: this.getFileType(file.mimetype || 'application/octet-stream'),
        index,
      };
    });
  }

  private processTimelines(timelines: Array<{
    timeHours: string;
    timeMinutes: string;
    timeSeconds: string;
    label: string;
  }>, _context: ProcessingContext): Array<{
    value: {
      hours: string;
      minutes: string;
      seconds: string;
      totalSeconds: number;
    };
    label: string;
    selected: boolean;
    index: number;
    timeFormatted: string;
    totalSeconds: number;
  }> {
    if (!Array.isArray(timelines)) {
      return [];
    }

    return timelines.map((timeline, index) => {
      const totalSeconds = this.calculateTotalSeconds(timeline);
      const timeFormatted = this.formatTime(timeline);

      return {
        value: {
          hours: timeline.timeHours,
          minutes: timeline.timeMinutes,
          seconds: timeline.timeSeconds,
          totalSeconds,
        },
        label: timeline.label || `Timeline ${index + 1}`,
        selected: true,
        index,
        timeFormatted,
        totalSeconds,
      };
    });
  }

  private calculateTotalSeconds(timeline: any): number {
    const hours = parseInt(timeline.timeHours, 10) || 0;
    const minutes = parseInt(timeline.timeMinutes, 10) || 0;
    const seconds = parseInt(timeline.timeSeconds, 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  private formatTime(timeline: any): string {
    const hours = timeline.timeHours || '00';
    const minutes = timeline.timeMinutes || '00';
    const seconds = timeline.timeSeconds || '00';
    return `${hours}:${minutes}:${seconds}`;
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
