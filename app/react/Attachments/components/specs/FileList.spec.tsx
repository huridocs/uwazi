import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FileType } from 'shared/types/fileType';
import UploadButton from 'app/Metadata/components/UploadButton';
import { EntitySchema } from 'shared/types/entityType';
import languageLib from 'shared/languages';
import { ConnectedFile as File } from '../File';
import { FileList, FileListProps } from '../FileList';

describe('FileList', () => {
  let component: ShallowWrapper<FileList>;
  let props: FileListProps;
  let file: FileType;
  let file2: FileType;
  let entity: EntitySchema;

  beforeEach(() => {
    file = {
      _id: '213',
      originalname: 'Human_name_1.pdf',
      filename: 'random.ext',
      language: 'eng',
    };
    file2 = {
      _id: '453',
      originalname: 'Human_name_2.pdf',
      filename: 'random2.ext',
      language: 'esp',
    };

    entity = { title: 'The humans', _id: '123', language: 'en', sharedId: '98sdff8' };

    props = {
      files: [file, file2],
      storeKey: 'library',
      entity,
      mainContext: { confirm: jest.fn },
    };
  });

  const render = () => {
    component = shallow(<FileList {...props} />);
  };

  it('should render the files correctly', () => {
    render();
    const renderedFiles = component.find(File);
    expect(renderedFiles.length).toBe(2);
    expect(renderedFiles.at(0).props().file).toBe(file);
    expect(renderedFiles.at(1).props().file).toBe(file2);
    const firstFile = renderedFiles.at(0).props().file;
    const language = languageLib.get(firstFile.language as string, 'ISO639_1');
    expect(entity.language).toEqual(language);
  });

  it('should render the files starting with the one with the system language', () => {
    props.files = [file2, file];
    render();
    const renderedFiles = component.find(File);
    const firstFile = renderedFiles.at(0).props().file;
    const language = languageLib.get(firstFile.language as string, 'ISO639_1');
    expect(entity.language).toEqual(language);
  });

  it('should render the files even when there is not file with entity language', () => {
    props.files = [file2, file2];
    render();
    const renderedFiles = component.find(File);
    expect(renderedFiles.length).toBe(2);
    expect(renderedFiles.at(0).props().file).toBe(file2);
    expect(renderedFiles.at(1).props().file).toBe(file2);
  });

  it('should render an upload button by default', () => {
    render();
    const button = component.find(UploadButton);
    expect(button.props().entitySharedId).toBe(props.entity!.sharedId);
  });

  it('should check authorization roles to upload files', () => {
    render();
    const button = component.find(UploadButton);
    expect(button.parent().props().roles).toEqual(['admin', 'editor']);
    expect(button.parent().props().orWriteAccessTo).toEqual([props.entity]);
  });
});
