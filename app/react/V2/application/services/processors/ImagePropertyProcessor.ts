import { ImageMetadataProperty } from 'app/V2/domain/entities/types';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class ImagePropertyProcessor extends BasePropertyProcessor {
    readonly name = 'ImagePropertyProcessor';

    readonly propertyTypes: string[] = ['image'];

    processBatch(
        properties: AdapterMetadataProperty[],
        context: ProcessingContext
    ): AdapterMetadataProperty[] {
        const results: AdapterMetadataProperty[] = [];

        properties.forEach(property => {
            try {
                const values = this.processImageFiles(property.value, context);
                results.push(Object.assign(property, { values }));
            } catch (error) {
                console.error(`Error processing image property ${property.name}:`, error);
            }
        });

        return results;
    }

    protected formatProperty(
        property: AdapterMetadataProperty,
        context: ProcessingContext
    ): ImageMetadataProperty['values'] {
        return this.processImageFiles(property.value, context);
    }

    private processImageFiles(
        value: any,
        _context: ProcessingContext
    ): ImageMetadataProperty['values'] {
        if (!value) {
            return [];
        }

        const values = Array.isArray(value) ? value : [value];

        return values.map((imageValue: any) => {
            if (typeof imageValue === 'string') {
                return {
                    value: imageValue,
                    alt: this.extractAltFromUrl(imageValue),
                };
            }

            if (typeof imageValue === 'object' && imageValue !== null) {
                return {
                    value: imageValue.value || imageValue.url || '',
                    alt: imageValue.alt || this.extractAltFromUrl(imageValue.value || imageValue.url || ''),
                };
            }

            return {
                value: imageValue?.toString() || '',
            };
        });
    }

    private extractAltFromUrl(url: string): string {
        if (!url) return '';

        const filename = url.split('/').pop() || '';
        const nameWithoutExtension = filename.split('.')[0];

        return nameWithoutExtension
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
}