[![devDependency Status](https://david-dm.org/huridocs/uwazidocs/dev-status.svg)](https://david-dm.org/huridocs/uwazi#info=devDependencies)
[![dependency Status](https://david-dm.org/huridocs/uwazidocs/status.svg)](https://david-dm.org/huridocs/uwazi#info=dependencies)

#Global dependencies

- **NodeJs 6.9.5**
    - Ubuntu
      ```
      $ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
      $ sudo apt-get install -y nodejs
      ```
- **Elasticsearch** (2.4)
    - OSX
      - `brew update`
      - `brew install elasticsearch@2.4`

    - Ubuntu
      ```
      $ wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
      $ echo "deb http://packages.elastic.co/elasticsearch/2.x/debian stable main" | sudo tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list
      $ sudo apt-get update && sudo apt-get -y install elasticsearch
      $ sudo update-rc.d elasticsearch defaults 95 10

      $ echo "deb https://packages.elastic.co/logstash/2.3/debian stable main" | sudo tee -a /etc/apt/sources.list
      $ sudo apt-get update && sudo apt-get install logstash
      ```
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
  $ ./database/blank_state.sh
  ```

- launch application: `foreman start`, the app will be available after few seconds on localhost:3000
- test api: `node test_api.js`
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

- If autowatch does not work, check the max_user_watches with:

  ```
  $ sysctl fs.inotify.max_user_watches
  ```

  If the number is relatively low (bellow 200K) try increasing the watchers by default with:

  ```
  $ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
  ```

- If the nice 'World Globe' on the 'server listening on port...' line is not showing properly:


  ```
  $ sudo apt-get install ttf-ancient-fonts
  ```

=)
