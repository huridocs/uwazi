# Uwazi

[![devDependency Status](https://david-dm.org/huridocs/uwazidocs/dev-status.svg)](https://david-dm.org/huridocs/uwazi#info=devDependencies)
[![dependency Status](https://david-dm.org/huridocs/uwazidocs/status.svg)](https://david-dm.org/huridocs/uwazi#info=dependencies)

- [Installation](#installation)
  - [Install global dependencies](#install-global-dependencies)
  - [Clone the Uwazi Repository](#clone-the-uwazi-repository)
  - [Project dependencies](#project-dependencies)
  - [Setup fixtures](#setup-fixtures)
- [Launching the application](#launching-the-application)
- [Development](#development)
  - [Testing](#testing)
  - [IDE Suggestions](#ide-suggestions)
- [Troubleshooting](#troubleshooting)
- [User Guide](#user-guide)

# Installation

The following steps will guide you through installing Uwazi on your machine.

## Install global dependencies

- **NodeJs 6.9.5**
    - Ubuntu
      ```
      $ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
      $ sudo apt-get install -y nodejs
      ```
- **Elasticsearch** (5.4)
   - https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html
    
- **MongoDB**
    - Ubuntu
      https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

## Clone the Uwazi repository

If you don't have Git, install it first:

- Ubuntu
    ```
    $ sudo apt-get install git
    ```
- or <https://git-scm.com/downloads>

Clone the project on your machine and change into the project directory

```
$ git clone https://github.com/huridocs/uwazi.git
$ cd uwazi
```

## Project dependencies

We'll use Yarn to install the project's dependencies.
Install [Yarn from here](https://yarnpkg.com/en/).

Then from the project directory run:

```
$ yarn install
```
Several globally accessible gems and npm modules are required:

```
$ sudo gem install foreman
$ sudo npm install -g webpack
$ sudo npm install -g nodemon
$ sudo npm install -g karma-cli
```

## Setup fixtures

To initialize the database and indexes for the first time, run the
`blank_state.sh` script in the `database` directory.

```
$ cd database
$ ./blank_state.sh
```

# Launching the application

To launch the application, change into the project root
directory and run

```
$ foreman start -p 3000
```

The app should be available after a few seconds on [localhost:3000](http://localhost:3000)

# Development

## Testing

- Testing the server API:

  From the project directory run

  ```
  $ node api_test.js
  ```

  if you want to watch for file changes, run this command instead:

  ```
  $ ./test_api.sh
  ```
- Testing the React front-end web client:

  ```
  $ karma start
  ```

## IDE Suggestions

- Ubuntu

  - SublimeText 3:

    In order to install the ES6 linter, you need to add to the package control the packages:
    - SublimeLinter
    - SublimeLinter-eslint
    In theory, it will use the eslint from the local node_modules, and the configuration from the .eslintrc
    In order to do JSX fromatting:
    - Babel
    Then open a .js file and go to:
    view -> syntax -> open all current extensions as ... -> Babel -> Javascript (Babel)

# Troubleshooting

- If autowatch does not work, check the `max_user_watches` with:

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
- If you get `MongoError` or `ECONNREFUSED` errors make sure MongoDB and Elasticsearch services are running

  ```
  $ service mongod start
  ```

  ```
  $ systemctl start elasticsearch.service
  ```

  # User Guide

  You can find the User Guide [here](https://github.com/huridocs/uwazi/wiki).