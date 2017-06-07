import {store} from './store';
import {actions} from 'app/BasicReducer';
import socket from './socket';

socket.on('templateChange', (template) => {
  store.dispatch(actions.update('templates', template));
});
socket.on('templateDelete', (template) => {
  store.dispatch(actions.remove('templates', {_id: template.id}));
});

socket.on('thesauriChange', (thesauri) => {
  store.dispatch(actions.update('thesauris', thesauri));
});
socket.on('thesauriDelete', (thesauri) => {
  store.dispatch(actions.remove('thesauris', {_id: thesauri.id}));
});
