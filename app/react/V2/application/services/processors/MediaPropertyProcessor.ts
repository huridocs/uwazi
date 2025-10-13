import { FilePropertyTypes } from 'app/V2/domain/entities/types';
import {
  FormattedProperty,
  PropertyValue,
  PropertyTypeProcessor,
  ProcessingContext,
} from './types';

export class MediaPropertyProcessor implements PropertyTypeProcessor {
  readonly name = 'MediaPropertyProcessor';
  readonly propertyTypes: FilePropertyTypes[] = ['media'];

  processBatch(properties: any[], context: ProcessingContext): Map<string, FormattedProperty> {
    const results = new Map<string, FormattedProperty>();

    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property._fieldName}`;
        const mediaFiles = this.processMediaFiles(property.value, context);
        const timelines =
          context.editionMode && property.timelines
            ? this.processTimelines(property.timelines, context)
            : [];

        const formattedProperty: FormattedProperty = {
          ...property,
          values: mediaFiles,
          timelines: context.editionMode ? timelines : undefined,
          mediaFiles: context.flattenMediaFiles ? mediaFiles : undefined,
          fileMetadata: this.calculateFileMetadata(mediaFiles, timelines),
          type: 'media',
        };

        results.set(key, formattedProperty);
      } catch (error) {
        console.error(`Error processing media property ${property._fieldName}:`, error);
      }
    });

    return results;
  }

  private processMediaFiles(files: any[], _context: ProcessingContext): PropertyValue[] {
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map((file, index) => {
      // Handle string format: "(/api/files/file.mp4, {\"timelinks\":{...}})"
      if (typeof file.value === 'string' && file.value.startsWith('(')) {
        try {
          // Parse the tuple string format
          const match = file.value.match(/^\(([^,]+),\s*({.*})\)$/);
          if (match) {
            const fileUrl = match[1];
            const timelinksData = JSON.parse(match[2]);
            const fileName = fileUrl.split('/').pop() || 'Unknown file';

            return {
              value: fileUrl,
              label: fileName,
              displayValue: fileName,
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

      // Handle object format (legacy)
      return {
        value: file._id || file.id || file.value,
        label: file.originalname || file.filename || file.label || 'Unknown file',
        displayValue: file.originalname || file.filename || file.label || 'Unknown file',
        url: file.url || `/api/files/${file._id || file.id || file.value}`,
        mimetype: file.mimetype,
        size: file.size || 0,
        duration: file.duration || 0,
        dimensions: file.dimensions,
        thumbnail: file.thumbnail,
        selected: true,
        filename: file.filename,
        originalname: file.originalname,
        fileType: this.getFileType(file.mimetype),
        index,
      };
    });
  }

  private processTimelines(timelines: any[], _context: ProcessingContext): PropertyValue[] {
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
        displayValue: `${timeFormatted} - ${timeline.label || `Timeline ${index + 1}`}`,
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

  private calculateFileMetadata(mediaFiles: PropertyValue[], timelines: PropertyValue[]) {
    const totalSize = mediaFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalDuration = mediaFiles.reduce((sum, file) => sum + (file.duration || 0), 0);
    const fileTypes = [...new Set(mediaFiles.map(file => file.fileType).filter(Boolean))];

    return {
      totalSize,
      totalDuration,
      fileTypes,
      timelineCount: timelines.length,
    };
  }
}
