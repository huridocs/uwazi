import { processingContext, rawEntity } from './SimpleTestFixtures';
import { EntityAdapterProcessor } from '../EntityAdapterProcessor';
import { Entity, MetadataProperty } from 'app/V2/domain';
import { DateMetadataProperty, MultiDateMetadataProperty } from 'app/V2/domain/entities/types';

describe('Simplified Processor Tests', () => {
    const entityAdapterProcessor = new EntityAdapterProcessor(processingContext);
    let entity: Entity;
    let restEntity: Omit<Entity, 'metadata'>;
    let metadata: MetadataProperty[];

    beforeAll(async () => {
        const result = await entityAdapterProcessor.processEntity(rawEntity);
        entity = result.entity;
        ({ metadata, ...restEntity } = entity);
    });

    it('should process entity data', async () => {
        const creationDate: DateMetadataProperty = {
            name: "creationDate",
            type: "date",
            label: 'creationDate',
            translatedLabel: 'creationDate',
            values: [{ value: 1759374706197, label: 'Oct 2, 2025' }],
            dateObject: new Date('2025-10-02T04:09:57.000Z'),
        };

        const editDate: DateMetadataProperty = {
            name: "editDate",
            type: "date",
            label: 'editDate',
            translatedLabel: 'editDate',
            values: [{ value: 1760320591458, label: 'Oct 3, 2025' }],
            dateObject: new Date('2025-10-03T22:04:18.000Z'),
        };

        const formattedMetadata = {
            _id: "68ddecdbc9474e23bb5e914b",
            name: "Full template",
            label: "Full template",
            color: "#C03B22",
            entityViewPage: ""
        };
        const expectedEntity: Omit<Entity, 'metadata'> = {
            _id: '68dded72c9474e23bb5e9254',
            title: 'Full entity',
            sharedId: '36l0vr92qce',
            language: 'en',
            creationDate: creationDate,
            editDate: editDate,
            icon: { _id: 'SMR' },
        };

        expect(restEntity).toMatchObject(expectedEntity);
    });

    it('should process single date property', async () => {
        const singleDateProperty: DateMetadataProperty = {
            name: "single_date",
            type: "date",
            label: 'Single date',
            translatedLabel: 'Single date',
            values: [{ value: 1662380774900, label: 'Oct 2, 2025' }],
            dateObject: new Date('2025-10-02T04:09:57.000Z'),
        };

        expect(metadata[0]).toMatchObject(singleDateProperty);
    });

    it('should process multiple date property', async () => {
        const multipleDateProperty: MultiDateMetadataProperty = {
            name: "multiple_date",
            type: "multidate",
            label: 'Multiple dates',
            translatedLabel: 'Multiple dates',
            values: [{ value: 1662380774900, label: 'Oct 2, 2025' }, { value: 1664982774900, label: 'Oct 3, 2025' }, { value: 1667588374900, label: 'Oct 4, 2025' }],
            dateObject: [new Date('2025-10-02T04:09:57.000Z'), new Date('2025-10-03T22:04:18.000Z'), new Date('2025-10-04T04:09:57.000Z')],
        };
    });
});
