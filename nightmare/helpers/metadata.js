import url from './url.js';

export function addThesauri(nightmare, name){
  return nightmare
        .goto(url + '/metadata')
        .click('.thesauris .panel-footer')
        .type('#thesauriName', name)
        .click('.save-template')
        .wait(100)
}
