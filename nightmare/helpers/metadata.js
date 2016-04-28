import url from './url.js';

export function addThesauri(nightmare, name){
  return nightmare
        .goto(url + '/metadata')
        .click('.thesauris .panel-footer')
        .insert('#thesauriName', name)
        .click('.save-template')
        .wait(100)
}

export function deleteThesauri(nightmare){
  return nightmare
        .goto(url + '/metadata')
        .wait('.thesauri-remove')
        .click('.thesauri-remove')
        .wait(100)
}
