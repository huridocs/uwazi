[![devDependency Status](https://david-dm.org/huridocs/uwazidocs/dev-status.svg)](https://david-dm.org/huridocs/uwazi#info=devDependencies)
[![dependency Status](https://david-dm.org/huridocs/uwazidocs/status.svg)](https://david-dm.org/huridocs/uwazi#info=dependencies)

#Global dependencies
- **Git**
  - Ubuntu
    ```
    $ sudo apt-get install git
    ```
  - or <https://git-scm.com/downloads>
- **NodeJs 6.9.5**
    - Ubuntu
      ```
      $ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
      $ sudo apt-get install -y nodejs
      ```
- **Elasticsearch** (5.4)
   - https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html
    
- **Docsplit**
    - OSX
      - `brew install ruby`
      - `brew install ghostscript`
      - `gem install docsplit`
      - install non optional dependencies for docsplit -> [https://documentcloud.github.io/docsplit/](https://documentcloud.github.io/docsplit/)
    - UBUNTU
      - install ruby `sudo apt-get install ruby-full`
      - `gem install docsplit`
      - install non optional dependencies for docsplit -> [https://documentcloud.github.io/docsplit/](https://documentcloud.github.io/docsplit/)

- **MongoDB**
    - Ubuntu
      https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

#Development

- **Clone the repository**
  ```
  $ git clone https://github.com/huridocs/uwazi.git
  $ cd uwazi
  ```

- **Dependencies**

  install [yarn](https://yarnpkg.com/en/) and execute:

  `$ yarn install`.

  Several globally accessible gems and npm modules are required:

  ```
  $ sudo gem install foreman
  $ sudo npm install -g webpack
  $ sudo npm install -g nodemon
  $ sudo npm install -g karma-cli
  ```

- **Fixtures**

  ```
  $ cd database
  $ ./blank_state.sh
  ```

- launch application: `foreman start -p 3000`, the app will be available after few seconds on localhost:3000
- test api: `node api_test.js`, if you want to watch for file changes: `./test_api.sh`
- test react: `karma start`

#Suggestions

- **IDE**

  -Ubuntu

    - SublimeText 3:

      In order to install the ES6 linter, you need to add to the package control the packages:
      - SublimeLinter
      - SublimeLinter-eslint
      In theory, it will use the eslint from the local node_modules, and the configuration from the .eslintrc
      In order to do JSX fromatting:
      - Babel
      Then open a .js file and go to:
      view -> syntax -> open all current extensions as ... -> Babel -> Javascript (Babel)

#Troubleshooting

- If autowatch does not work, check the max_user_watches with:

  ```
  $ sysctl fs.inotify.max_user_watches
  ```

  If the number is relatively low (bellow 200K) try increasing the watchers by default with:

  ```
  $ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
  ```

- If the nice 'World Globe' (🌎) on the 'server listening on port...' line is not showing properly:


  ```
  $ sudo apt-get install ttf-ancient-fonts
  ```

=)
