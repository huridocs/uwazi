import { FilePropertyTypes, MediaMetadataProperty, Timelink } from 'app/V2/domain/entities/types';
import { reportErrorToSentry } from 'app/V2/shared/errorUtils';
import { getMimetypeFromUrl } from 'app/V2/shared/formatHelpers';
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

        const mimetype = getMimetypeFromUrl(fileUrl);
        return [
          {
            value: fileUrl,
            alt: fileName,
            mimetype,
            fileType: this.getFileType(mimetype),
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
}
