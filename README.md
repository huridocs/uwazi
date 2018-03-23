![Uwazi Logo](https://www.uwazi.io/wp-content/uploads/2017/09/cropped-uwazi-color-logo-300x68.png)

[![devDependency Status](https://david-dm.org/huridocs/uwazidocs/dev-status.svg)](https://david-dm.org/huridocs/uwazi#info=devDependencies)
[![dependency Status](https://david-dm.org/huridocs/uwazidocs/status.svg)](https://david-dm.org/huridocs/uwazi#info=dependencies)
[![CircleCI](https://circleci.com/gh/huridocs/uwazi.svg?style=shield)](https://circleci.com/gh/huridocs/uwazi)
[![Maintainability](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/maintainability)](https://codeclimate.com/github/huridocs/uwazi/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/test_coverage)](https://codeclimate.com/github/huridocs/uwazi/test_coverage)


There are important stories within your documents. Uwazi helps you tell them.  Uwazi is a free, open-source solution for organising, analysing and publishing your documents.

[Uwazi](https://www.uwazi.io/) | [Huridocs](https://huridocs.org/)



Table of contents
=================

  * [Dependencies](#dependencies)
  * [Production](#production)
    * [Production Configuration](#production-configuration-advanced)
    * [Production Build](#production_build)
    * [Initial State](#initial_state)
    * [Production Run](#production_run)
  * [Development](#development)
    * [Development Run](#development_run)
    * [Testing](#testing)
      * [Unit and Integration tests](#unit_and_integration_tests)
      * [End to End (e2e)](#end_to_end_e2e)

# Dependencies

- **NodeJs 6.13.x** For ease of update, use nvm: https://github.com/creationix/nvm
- **Elasticsearch 5.5.x** https://www.elastic.co/guide/en/elasticsearch/reference/5.5/install-elasticsearch.html (Make sure to have 5.5, some sections of the instructions use 5.x which would install a different version)
- **MongoDB 3.4.x** https://docs.mongodb.com/v3.4/installation/ (there are known issues with 3.6, please ensure 3.4)
- **Yarn** https://yarnpkg.com/en/docs/install

# Production

### Production Configuration (advanced)

Uwazi is configured to run correctly with its default values. There is no need to change or reconfigure these values.

However, if you require different database names, elastic indexes, etc. you can override those defaults by exporting one or more of the following environment variables:

```
$ export DBHOST=localhost
$ export DATABASE_NAME=uwazi_development
$ export ELASTICSEARCH_URL=http://localhost:9200
$ export INDEX_NAME=uwazi_development
$ export API_URL=/api/
$ export PORT=3000
```

Again, please be adviced that there is no need to export any value for a normal installation and only do so if you are certain you need different defaults.  If these values are not correctly overriden, Uwazi will fail to run properly.

### Production Build

```
$ yarn production-build
```

### Initial State

The first time you run Uwazi, you will need to initialize the database with its default blank values.  To do so:
```
$ yarn blank-state
```
Do no run this command for existing projects, as this will erase the entire database.

### Production Run

```
$ yarn run-production
```

# Development

### Development Run

```
$ yarn hot
```
This will launch a webpack server and nodemon app server for hot reloading any changes you make.

### Testing

#### Unit and Integration tests

We test using the JEST framework (built on top of Jasmine).  To run the unit and integration tests, execute

```
$ ./node_modules/.bin/jest
```

This will run the entire battery of tests, both on server and client apps.

#### End to End (e2e)

For End-to-End testing, we have a full set of fixtures that test the overall functionality.  Be advised that, for the time being, these tests are run ON THE SAME DATABASE as the default database (uwazi_developmet), so running these tests will DELETE any exisitng data and replace it with the testing fixtures.  DO NOT RUN ON PRODUCTION ENVIROMENTS!

Running end to end tests require a runnig uwazi app.

```
$ yarn hot
```

On a different console tab, run
```
$ yarn e2e
```

Note that if you already have an instance running, this will likely throw an error of ports already been used.  Only one instance of uwazi may be run in a the same port at the same time.


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
