import api from 'app/Entities/V2NewRelationshipsAPI';
import { RequestParams } from 'app/utils/RequestParams';

const getRelationshipsByEntity = sharedId => api.get(new RequestParams({ sharedId }));

export { getRelationshipsByEntity };
