import config from './config.js';

export function addThesauri(nightmare, name) {
  return nightmare
        .goto(config.url + '/metadata')
        .click('a[href="/thesauris/new"]')
        .insert('#thesauriName', name)
        .click('.save-template')
        .wait(50);
}

export function addValuesToThesauri(nightmare, thesauriName) {
  return nightmare
        .goto(config.url + '/metadata')
        .wait(50)
        .evaluate((name) => {
          let anchors = Array.from(document.querySelectorAll('.thesauris li a'));
          anchors.reduce((match, anchor) => {
            if (anchor.innerText === name) {
              return anchor;
            }
            return match;
          }, {}).click();
        }, thesauriName)
        .wait(50)
        .click('.fa-plus')
        .insert('.thesauri-values input', 'new value')
        .click('.fa-plus')
        .insert('.thesauri-values .form-group:nth-child(2) input', 'another new value')
        .wait(50)
        .click('.save-template');
}

export function deleteThesauri(nightmare, thesauriName) {
  return nightmare
        .goto(config.url + '/metadata')
        .evaluate((name) => {
          let liElements = document.querySelectorAll('.thesauris li');
          Object.keys(liElements).forEach((key) => {
            let liElement = liElements[key];
            if (liElement.getElementsByTagName('a')[0].innerText === name) {
              liElement.getElementsByClassName('thesauri-remove')[0].click();
            }
          });
        }, thesauriName);
}
