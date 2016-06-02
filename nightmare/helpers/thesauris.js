import url from './url.js';

export function addThesauri(nightmare, thesauri_name){
  return nightmare
        .goto(url + '/metadata')
        .click('a[href="/thesauris/new"]')
        .insert('#thesauriName', thesauri_name)
        .click('.save-template')
        .wait(50)
}

export function addValuesToThesauri(nightmare, thesauri_name){
  return nightmare
        .goto(url + '/metadata')
        .wait(50)
        .evaluate((thesauri_name) => {
          let anchors = Array.from(document.querySelectorAll('.thesauris li a'));
          anchors.reduce((match, anchor) => {
            if (anchor.innerText === thesauri_name) {
              return anchor;
            }
            return match;
          }, {}).click();
        }, thesauri_name)
        .wait(50)
        .click('.fa-plus')
        .insert('.thesauri-values input', "new value")
        .click('.fa-plus')
        .insert('.thesauri-values .form-group:nth-child(2) input', "another new value")
        .wait(50)
        .click('.save-template')
}

export function deleteThesauri(nightmare, thesauri_name){
  return nightmare
        .goto(url + '/metadata')
        .evaluate((thesauri_name) => {
          let liElements = document.querySelectorAll('.thesauris li');
          Object.keys(liElements).forEach((key) => {
            let liElement = liElements[key]
            if (liElement.getElementsByTagName('a')[0].innerText === thesauri_name) {
              liElement.getElementsByClassName('thesauri-remove')[0].click();
            }
          })
        }, thesauri_name)
}
