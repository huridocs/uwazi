/* eslint-disable max-statements */
import { CreateEntityUseCaseInput } from '#api/core/application/CreateEntity.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { UpdateEntityUseCaseInput } from '#api/core/application/UpdateEntity.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { CreateEntityDTO, UpdateEntityRequest } from './Schemas.js';

type ToEntityCreateInputProps = {
  dto: CreateEntityDTO;
  inputFiles?: InputFile[];
};

type ToEntityUpdateInputProps = {
  dto: UpdateEntityRequest;
  inputFiles?: InputFile[];
};

class ExpressEntityMapper {
  static toEntityUpdateInput(props: ToEntityUpdateInputProps): UpdateEntityUseCaseInput {
    const [attachmentsUploaded, attachmentsUpdated] = ArrayUtils.splitInTwo(
      props.dto.attachments || [],
      a => !a._id
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, documentsUpdated] = ArrayUtils.splitInTwo(props.dto.documents || [], d => !d._id);

    const input: UpdateEntityUseCaseInput = {
      sharedId: props.dto.sharedId,
      language: props.dto.language as LanguageISO6391,
      propertyAssignments: [
        {
          name: 'title',
          value: [{ value: props.dto.title }],
        },
      ],
      files: [
        ...documentsUpdated.map(doc => ({ id: doc._id, originalname: doc.originalname })),
        ...attachmentsUpdated.map(doc => ({
          id: doc._id!,
          originalname: doc.originalname,
        })),
      ],
    };

    if (props?.inputFiles) {
      input.uploadedFiles = props.inputFiles;
    }

    if (attachmentsUploaded.length) {
      const attachmentsWithUrl = attachmentsUploaded.filter(
        (a): a is typeof a & { url: string } => !!a.url
      );

      const urlAttachments = attachmentsWithUrl.map(({ originalname, url }) =>
        InputFile.createUrlAttachment({
          originalname,
          url,
        })
      );

      if (input.uploadedFiles) {
        input.uploadedFiles.push(...urlAttachments);
      } else {
        input.uploadedFiles = urlAttachments;
      }
    }

    if (props.dto?.template) {
      input.templateId = props.dto.template.toString();
    }

    if (props.dto?.icon) {
      if (props.dto.icon._id === null) {
        input.icon = undefined;
      } else {
        input.icon = {
          id: props.dto.icon._id!,
          label: props.dto.icon.label!,
          type: props.dto.icon.type!,
        };
      }
    }

    if (props.dto.metadata) {
      const properties = Object.entries(props.dto.metadata).map(([name, value]) => ({
        name,
        value,
      }));

      input.propertyAssignments?.push(
        ...(properties as UpdateEntityUseCaseInput['propertyAssignments'])!
      );
    }

    return input;
  }

  static toEntityCreateInput(props: ToEntityCreateInputProps): CreateEntityUseCaseInput {
    const input: CreateEntityUseCaseInput = {
      propertyAssignments: [
        {
          name: 'title',
          value: [{ value: props.dto.title }],
        },
      ],
    };

    if (props?.inputFiles) {
      input.inputFiles = props.inputFiles;
    }

    if (props.dto?.attachments?.length) {
      const attachmentsWithUrl = props.dto.attachments.filter(
        (a): a is typeof a & { url: string } => !!a.url
      );
      const urlAttachments = attachmentsWithUrl.map(({ originalname, url }) =>
        InputFile.createUrlAttachment({
          originalname,
          url,
        })
      );

      if (input.inputFiles) {
        input.inputFiles.push(...urlAttachments);
      } else {
        input.inputFiles = urlAttachments;
      }
    }

    if (props.dto?.template) {
      input.templateId = props.dto.template.toString();
    }

    if (props.dto?.icon) {
      if (props.dto.icon._id === null) {
        input.icon = undefined;
      } else {
        input.icon = {
          id: props.dto.icon._id!,
          label: props.dto.icon.label!,
          type: props.dto.icon.type!,
        };
      }
    }

    if (props.dto.metadata) {
      input.propertyAssignments.push(
        ...(Object.entries(props.dto.metadata).map(([name, value]) => ({
          name,
          value,
        })) as CreateEntityUseCaseInput['propertyAssignments'])
      );
    }

    return input;
  }
}

export { ExpressEntityMapper };
