import {
  FormattedProperty,
  PropertyValue,
  PropertyTypeProcessor,
  ProcessingContext,
} from './types';

export class MediaPropertyProcessor implements PropertyTypeProcessor {
  readonly name = 'MediaPropertyProcessor';
  readonly propertyTypes = ['media'];

  async processBatch(
    properties: any[],
    context: ProcessingContext
  ): Promise<Map<string, FormattedProperty>> {
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

    return files.map((file, index) => ({
      value: file._id || file.id,
      label: file.originalname || file.filename || 'Unknown file',
      displayValue: file.originalname || file.filename || 'Unknown file',
      url: `/api/files/${file._id || file.id}`,
      mimetype: file.mimetype,
      size: file.size,
      duration: file.duration,
      dimensions: file.dimensions,
      thumbnail: file.thumbnail,
      selected: true,
      filename: file.filename,
      originalname: file.originalname,
      fileType: this.getFileType(file.mimetype),
      index,
    }));
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
