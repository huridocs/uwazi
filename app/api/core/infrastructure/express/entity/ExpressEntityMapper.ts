import { CreateEntityUseCaseInput } from '#api/core/application/CreateEntity.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { CreateEntityDTO } from '#api/core/infrastructure/express/entity/Schemas.js';

type ToEntityCreateInputProps = {
  dto: CreateEntityDTO;
  inputFiles?: InputFile[];
};

class ExpressEntityMapper {
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
