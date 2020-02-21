import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FileList, FileListProps } from '../FileList';
import { ConnectedFile as File } from '../File';
import { FileType } from 'shared/types/fileType';
import UploadButton from 'app/Metadata/components/UploadButton';

describe('FileList', () => {
  let component: ShallowWrapper<FileList>;
  let props: FileListProps;
  let context: any;
  let file: FileType;
  let file2: FileType;

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

    props = {
      files: [file, file2],
      readOnly: false,
      storeKey: 'library',
      entitySharedId: 'ab12j923md',
    };
  });

  const render = () => {
    component = shallow(<FileList {...props} />);
  };

  it('should render the files', () => {
    render();
    const renderedFiles = component.find(File);
    expect(renderedFiles.length).toBe(2);
    expect(renderedFiles.at(0).props().file).toBe(file);
    expect(renderedFiles.at(1).props().file).toBe(file2);
  });

  it('should render an upload button', () => {
    render();
    const button = component.find(UploadButton);
    expect(button.props().entitySharedId).toBe(props.entitySharedId);
  });
});
