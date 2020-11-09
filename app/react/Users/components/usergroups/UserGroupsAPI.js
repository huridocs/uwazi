import api from 'app/utils/api';

export default {
  getUserGroups(requestParams) {
    return api.get('usergroups', requestParams).then(response => response.json);
  },
};
