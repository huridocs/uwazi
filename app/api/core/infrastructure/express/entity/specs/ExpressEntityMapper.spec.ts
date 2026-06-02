import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { ExpressEntityMapper } from '../ExpressEntityMapper.js';
import { CreateEntityDTO } from '../Schemas.js';

describe('ExpressEntityMapper', () => {
  // eslint-disable-next-line max-statements
  describe('toEntityCreateInput()', () => {
    it('should map title correctly', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity Title',
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result).toEqual({
        propertyAssignments: [
          {
            name: 'title',
            value: [{ value: 'Test Entity Title' }],
          },
        ],
      });
    });

    it('should map template ID when provided', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        template: 'template123',
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.templateId).toBe('template123');
    });

    it('should map icon when provided', () => {
      const result1 = ExpressEntityMapper.toEntityCreateInput({
        dto: {
          title: 'Test Entity',
          icon: {
            _id: 'icon123',
            label: 'Icon Label',
            type: 'icon-type',
          },
        },
      });

      const result2 = ExpressEntityMapper.toEntityCreateInput({
        dto: {
          title: 'Test Entity',
          icon: {
            _id: null,
            label: '',
            type: '',
          },
        },
      });

      expect(result1.icon).toEqual({
        id: 'icon123',
        label: 'Icon Label',
        type: 'icon-type',
      });

      expect(result2.icon).toBeUndefined();
    });

    it('should map inputFiles when provided', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
      };
      const inputFiles: InputFile[] = [
        {
          mimetype: 'application/pdf',
          filename: 'test.pdf',
          filepath: '/tmp/test.pdf',
          originalname: 'test.pdf',
          isAttachment: () => false,
        } as unknown as InputFile,
      ];

      const result = ExpressEntityMapper.toEntityCreateInput({ dto, inputFiles });

      expect(result.inputFiles).toBe(inputFiles);
    });

    it('should map URL attachments from DTO', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        attachments: [
          { originalname: 'not a url attachment' },
          { originalname: 'Document 1.pdf', url: 'https://example.com/doc1.pdf' },
          { originalname: 'Document 2.docx', url: 'https://example.com/doc2.docx' },
        ],
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.inputFiles).toBeDefined();
      expect(result.inputFiles).toHaveLength(2);
      expect(result.inputFiles?.[0].metadata.originalname).toBe('Document 1.pdf');
      expect(result.inputFiles?.[0].metadata.url).toBe('https://example.com/doc1.pdf');
      expect(result.inputFiles?.[1].metadata.originalname).toBe('Document 2.docx');
      expect(result.inputFiles?.[1].metadata.url).toBe('https://example.com/doc2.docx');
    });

    it('should combine inputFiles and URL attachments', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        attachments: [
          {
            originalname: 'URL Document.pdf',
            url: 'https://example.com/doc.pdf',
          },
        ],
      };
      const inputFiles: InputFile[] = [
        {
          mimetype: 'application/pdf',
          filename: 'uploaded.pdf',
          filepath: '/tmp/uploaded.pdf',
          originalname: 'Uploaded Document.pdf',
          isAttachment: () => false,
        } as unknown as InputFile,
      ];

      const result = ExpressEntityMapper.toEntityCreateInput({ dto, inputFiles });

      expect(result.inputFiles).toHaveLength(2);
      expect(result.inputFiles?.[0]).toBe(inputFiles[0]);
      expect(result.inputFiles![1].metadata.originalname).toBe('URL Document.pdf');
      expect(result.inputFiles![1].metadata.url).toBe('https://example.com/doc.pdf');
    });

    it('should handle empty attachments array', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        attachments: [],
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.inputFiles).toBeUndefined();
    });

    it('should map text property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          text_property: [{ value: 'Some text content' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'text_property',
        value: [{ value: 'Some text content' }],
      });
    });

    it('should map markdown property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          markdown_property: [{ value: 'Some **markdown** content' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'markdown_property',
        value: [{ value: 'Some **markdown** content' }],
      });
    });

    it('should map numeric property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          numeric_property: [{ value: 42 }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'numeric_property',
        value: [{ value: 42 }],
      });
    });

    it('should map date property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          date_property: [{ value: 1651622400 }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'date_property',
        value: [{ value: 1651622400 }],
      });
    });

    it('should map multidate property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          multidate_property: [{ value: 1651622400 }, { value: 1651708800 }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'multidate_property',
        value: [{ value: 1651622400 }, { value: 1651708800 }],
      });
    });

    it('should map daterange property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          daterange_property: [{ value: { from: 1651622400, to: 1651708800 } }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'daterange_property',
        value: [{ value: { from: 1651622400, to: 1651708800 } }],
      });
    });

    it('should map multidaterange property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          multidaterange_property: [
            { value: { from: 1651622400, to: 1651708800 } },
            { value: { from: 1651968000, to: 1652486399 } },
          ],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'multidaterange_property',
        value: [
          { value: { from: 1651622400, to: 1651708800 } },
          { value: { from: 1651968000, to: 1652486399 } },
        ],
      });
    });

    it('should map geolocation property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          geolocation_property: [{ value: { lat: 46.66, lon: 8.28, label: 'Location' } }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'geolocation_property',
        value: [{ value: { lat: 46.66, lon: 8.28, label: 'Location' } }],
      });
    });

    it('should map select property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          select_property: [{ value: 'option1' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'select_property',
        value: [{ value: 'option1' }],
      });
    });

    it('should map multiselect property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          multiselect_property: [{ value: 'option1' }, { value: 'option2', label: 'Option 2' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'multiselect_property',
        value: [{ value: 'option1' }, { value: 'option2', label: 'Option 2' }],
      });
    });

    it('should map select property with parent', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          select_property: [
            {
              value: 'child1',
              label: 'Child 1',
              parent: { value: 'parent1', label: 'Parent 1' },
            },
          ],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'select_property',
        value: [
          {
            value: 'child1',
            label: 'Child 1',
            parent: { value: 'parent1', label: 'Parent 1' },
          },
        ],
      });
    });

    it('should map relationship property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          relationship_property: [
            {
              value: 'entity123',
              label: 'Related Entity',
              inheritedValue: [{ value: 'Inherited Value' }],
              inheritedType: 'text',
            },
          ],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'relationship_property',
        value: [
          {
            value: 'entity123',
            label: 'Related Entity',
            inheritedValue: [{ value: 'Inherited Value' }],
            inheritedType: 'text',
          },
        ],
      });
    });

    it('should map link property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          link_property: [{ value: { url: 'https://example.com', label: 'Example Link' } }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'link_property',
        value: [{ value: { url: 'https://example.com', label: 'Example Link' } }],
      });
    });

    it('should map image property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          image_property: [{ value: '/api/files/image.jpg' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'image_property',
        value: [{ value: '/api/files/image.jpg' }],
      });
    });

    it('should map media property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          media_property: [{ value: '/api/files/video.mp4' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'media_property',
        value: [{ value: '/api/files/video.mp4' }],
      });
    });

    it('should map preview property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          preview_property: [{ value: '/api/files/preview.jpg' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'preview_property',
        value: [{ value: '/api/files/preview.jpg' }],
      });
    });

    it('should map generatedid property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          generatedid_property: [{ value: 'GEN-12345' }],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'generatedid_property',
        value: [{ value: 'GEN-12345' }],
      });
    });

    it('should map nested property', () => {
      const dto: CreateEntityDTO = {
        title: 'Test Entity',
        metadata: {
          nested_property: [
            {
              value: {
                child_text: [{ value: 'Nested text' }],
                child_number: [{ value: 5 }],
              } as any,
            },
          ],
        },
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toContainEqual({
        name: 'nested_property',
        value: [
          {
            value: {
              child_text: [{ value: 'Nested text' }],
              child_number: [{ value: 5 }],
            },
          },
        ],
      });
    });

    it('should map complete entity with all fields', () => {
      const dto: CreateEntityDTO = {
        title: 'Complete Entity',
        template: 'template456',
        icon: {
          _id: 'icon789',
          label: 'Complete Icon',
          type: 'complete-icon-type',
        },
        metadata: {
          text: [{ value: 'Text value' }],
          numeric: [{ value: 100 }],
          date: [{ value: 1651622400 }],
        },
      };

      const inputFiles: InputFile[] = [
        {
          mimetype: 'application/pdf',
          filename: 'document.pdf',
          filepath: '/tmp/document.pdf',
          originalname: 'document.pdf',
          isAttachment: () => false,
        } as unknown as InputFile,
      ];

      const result = ExpressEntityMapper.toEntityCreateInput({ dto, inputFiles });

      expect(result).toEqual({
        templateId: 'template456',
        icon: {
          id: 'icon789',
          label: 'Complete Icon',
          type: 'complete-icon-type',
        },
        inputFiles,
        propertyAssignments: [
          {
            name: 'title',
            value: [{ value: 'Complete Entity' }],
          },
          {
            name: 'text',
            value: [{ value: 'Text value' }],
          },
          {
            name: 'numeric',
            value: [{ value: 100 }],
          },
          {
            name: 'date',
            value: [{ value: 1651622400 }],
          },
        ],
      });
    });

    it('should handle empty metadata object', () => {
      const dto: CreateEntityDTO = {
        title: 'Entity with no metadata',
        metadata: {},
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.propertyAssignments).toEqual([
        {
          name: 'title',
          value: [{ value: 'Entity with no metadata' }],
        },
      ]);
    });

    it('should handle missing optional fields', () => {
      const dto: CreateEntityDTO = {
        title: 'Minimal Entity',
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result).toEqual({
        propertyAssignments: [
          {
            name: 'title',
            value: [{ value: 'Minimal Entity' }],
          },
        ],
      });
      expect(result.templateId).toBeUndefined();
      expect(result.icon).toBeUndefined();
      expect(result.inputFiles).toBeUndefined();
    });
  });

  describe('URL attachment mapping', () => {
    it('should map URL attachments from DTO', () => {
      const dto: CreateEntityDTO = {
        title: 'Entity with URL attachments',
        attachments: [
          { originalname: 'Document 1.pdf', url: 'https://example.com/doc1.pdf' },
          { originalname: 'Document 2.docx', url: 'https://example.com/doc2.docx' },
        ],
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.inputFiles).toHaveLength(2);
      expect(result.inputFiles![0].isUrlAttachment()).toBe(true);
      expect(result.inputFiles![0].metadata.originalname).toBe('Document 1.pdf');
      // PDF and office documents default to text/html (only image/audio/text/video are accepted)
      expect(result.inputFiles![0].metadata.mimetype).toBe('text/html');
      expect(result.inputFiles![1].isUrlAttachment()).toBe(true);
      expect(result.inputFiles![1].metadata.originalname).toBe('Document 2.docx');
      expect(result.inputFiles![1].metadata.mimetype).toBe('text/html');
    });

    it('should combine inputFiles and URL attachments', () => {
      const uploadedFile = {
        mimetype: 'application/pdf',
        filename: 'uploaded.pdf',
        filepath: '/tmp/uploaded.pdf',
        originalname: 'uploaded.pdf',
        isAttachment: () => false,
      } as unknown as InputFile;

      const dto: CreateEntityDTO = {
        title: 'Entity with both file types',
        attachments: [{ originalname: 'Document 1.pdf', url: 'https://example.com/doc1.pdf' }],
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto, inputFiles: [uploadedFile] });

      expect(result.inputFiles).toHaveLength(2);
      expect(result.inputFiles![0]).toBe(uploadedFile);
      expect(result.inputFiles![1].isUrlAttachment()).toBe(true);
      expect(result.inputFiles![1].metadata.originalname).toBe('Document 1.pdf');
    });

    it('should handle empty attachments array', () => {
      const dto: CreateEntityDTO = {
        title: 'Entity with empty attachments',
        attachments: [],
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.inputFiles).toBeUndefined();
    });

    it('should deduce mimetype from URL extension', () => {
      const dto: CreateEntityDTO = {
        title: 'Entity with various attachment types',
        attachments: [
          { originalname: 'Image.png', url: 'https://example.com/image.png' },
          { originalname: 'Video.mp4', url: 'https://example.com/video.mp4' },
          { originalname: 'Text.txt', url: 'https://example.com/text.txt' },
        ],
      };

      const result = ExpressEntityMapper.toEntityCreateInput({ dto });

      expect(result.inputFiles).toHaveLength(3);
      expect(result.inputFiles![0].metadata.mimetype).toBe('image/png');
      expect(result.inputFiles![1].metadata.mimetype).toBe('video/mp4');
      expect(result.inputFiles![2].metadata.mimetype).toBe('text/plain');
    });
  });

  // eslint-disable-next-line max-statements
  describe('toEntityUpdateInput()', () => {
    it('should map basic required fields correctly', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Updated Entity Title',
        template: 'template456',
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.sharedId).toBe('shared123');
      expect(result.language).toBe('en');
      expect(result.propertyAssignments).toContainEqual({
        name: 'title',
        value: [{ value: 'Updated Entity Title' }],
      });
      expect(result.templateId).toBe('template456');
      expect(result.files).toEqual([]);
    });

    it('should map icon when provided', () => {
      const result1 = ExpressEntityMapper.toEntityUpdateInput({
        dto: {
          _id: 'entity123',
          sharedId: 'shared123',
          language: 'en',
          title: 'Entity',
          icon: {
            _id: 'icon789',
            label: 'Updated Icon',
            type: 'updated-icon-type',
          },
        },
      });

      expect(result1.icon).toEqual({
        id: 'icon789',
        label: 'Updated Icon',
        type: 'updated-icon-type',
      });
    });

    it('should set icon to undefined when icon._id is null', () => {
      const result = ExpressEntityMapper.toEntityUpdateInput({
        dto: {
          _id: 'entity123',
          sharedId: 'shared123',
          language: 'en',
          title: 'Entity',
          icon: {
            _id: null,
            label: '',
            type: '',
          },
        },
      });

      expect(result.icon).toBeUndefined();
    });

    it('should map existing documents with _id to files array', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        documents: [
          { _id: 'doc1', originalname: 'document1.pdf' },
          { _id: 'doc2', originalname: 'document2.pdf' },
        ],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.files).toEqual([
        { id: 'doc1', originalname: 'document1.pdf' },
        { id: 'doc2', originalname: 'document2.pdf' },
      ]);
    });

    it('should map existing attachments with _id to files array', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        attachments: [
          { _id: 'att1', originalname: 'attachment1.pdf' },
          { _id: 'att2', originalname: 'attachment2.pdf' },
        ],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.files).toEqual([
        { id: 'att1', originalname: 'attachment1.pdf' },
        { id: 'att2', originalname: 'attachment2.pdf' },
      ]);
    });

    it('should combine documents and attachments with _id in files array', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        documents: [{ _id: 'doc1', originalname: 'document1.pdf' }],
        attachments: [
          { _id: 'att1', originalname: 'attachment1.pdf' },
          { _id: 'att2', originalname: 'attachment2.pdf' },
        ],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.files).toEqual([
        { id: 'doc1', originalname: 'document1.pdf' },
        { id: 'att1', originalname: 'attachment1.pdf' },
        { id: 'att2', originalname: 'attachment2.pdf' },
      ]);
    });

    it('should map new attachments without _id to uploadedFiles as URL attachments', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        attachments: [
          { originalname: 'new-attachment.pdf', url: 'https://example.com/new-attachment.pdf' },
        ],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.uploadedFiles).toBeDefined();
      expect(result.uploadedFiles).toHaveLength(1);
      expect(result.uploadedFiles![0].metadata.originalname).toBe('new-attachment.pdf');
      expect(result.uploadedFiles![0].metadata.url).toBe('https://example.com/new-attachment.pdf');
    });

    it('should separate new and existing attachments correctly', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        attachments: [
          { _id: 'att1', originalname: 'existing-attachment.pdf' },
          {
            originalname: 'new-attachment.pdf',
            url: 'https://example.com/new-attachment.pdf',
          },
        ],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.files).toContainEqual({
        id: 'att1',
        originalname: 'existing-attachment.pdf',
      });
      expect(result.uploadedFiles).toHaveLength(1);
      expect(result.uploadedFiles![0].metadata.originalname).toBe('new-attachment.pdf');
    });

    it('should map inputFiles when provided', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
      };
      const inputFiles: InputFile[] = [
        {
          mimetype: 'application/pdf',
          filename: 'uploaded.pdf',
          filepath: '/tmp/uploaded.pdf',
          originalname: 'uploaded.pdf',
          isAttachment: () => false,
        } as unknown as InputFile,
      ];

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto, inputFiles });

      expect(result.uploadedFiles).toBe(inputFiles);
    });

    it('should combine inputFiles and URL attachments', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        attachments: [
          {
            originalname: 'url-attachment.pdf',
            url: 'https://example.com/url-attachment.pdf',
          },
        ],
      };
      const inputFiles: InputFile[] = [
        {
          mimetype: 'application/pdf',
          filename: 'uploaded.pdf',
          filepath: '/tmp/uploaded.pdf',
          originalname: 'uploaded.pdf',
          isAttachment: () => false,
        } as unknown as InputFile,
      ];

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto, inputFiles });

      expect(result.uploadedFiles).toHaveLength(2);
      expect(result.uploadedFiles![0]).toBe(inputFiles[0]);
      expect(result.uploadedFiles![1].metadata.originalname).toBe('url-attachment.pdf');
      expect(result.uploadedFiles![1].metadata.url).toBe('https://example.com/url-attachment.pdf');
    });

    it('should filter out attachments without URL when creating URL attachments', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        attachments: [
          { originalname: 'no-url.pdf' },
          { originalname: 'with-url.pdf', url: 'https://example.com/with-url.pdf' },
        ],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.uploadedFiles).toHaveLength(1);
      expect(result.uploadedFiles![0].metadata.originalname).toBe('with-url.pdf');
    });

    it('should handle empty metadata object', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        metadata: {},
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.propertyAssignments).toHaveLength(1);
      expect(result.propertyAssignments).toEqual([
        {
          name: 'title',
          value: [{ value: 'Entity' }],
        },
      ]);
    });

    it('should handle attachments and documents with empty arrays', () => {
      const dto = {
        _id: 'entity123',
        sharedId: 'shared123',
        language: 'en',
        title: 'Entity',
        documents: [],
        attachments: [],
      };

      const result = ExpressEntityMapper.toEntityUpdateInput({ dto });

      expect(result.files).toEqual([]);
      expect(result.uploadedFiles).toBeUndefined();
    });
  });
});
