/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import {MetadataObjectSchema, ObjectIdSchema} from 'shared/types/commonTypes';

export interface IXSuggestionType {
	_id?: ObjectIdSchema;
	entity: ObjectIdSchema;
	propertyName: string;
	suggestedValue: string;
	segment: string;
	language: string;
	state: 'Empty' | 'Filled';
	page: number;
}

export interface SuggestionType {
	type?: unknown;
	additionalProperties?: unknown;
	title?: string;
	definitions?: {
		[k: string]: unknown | undefined;
	};
	properties?: {
		[k: string]: unknown | undefined;
	};
	required?: unknown;
	currentValue?: {
		[k: string]: unknown | undefined;
	};
}
