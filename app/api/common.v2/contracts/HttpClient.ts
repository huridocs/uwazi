import { FileContents } from 'api/files.v2/model/FileContents';
import { HttpField } from './HttpField';

type PostFormDataInput = {
  url: string;
  fields: Record<string, HttpField>;
  files: Record<string, { filename: string; contents: FileContents }[]>;
};

type GetInput = {
  url: string;
};

interface HttpClient {
  postFormData<T>(input: PostFormDataInput): Promise<T>;
  get<Response>(input: GetInput): Promise<Response>;
}

export type { GetInput, HttpClient, PostFormDataInput };
