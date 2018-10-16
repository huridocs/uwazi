![Uwazi Logo](https://www.uwazi.io/wp-content/uploads/2017/09/cropped-uwazi-color-logo-300x68.png)

[![devDependency Status](https://david-dm.org/huridocs/uwazidocs/dev-status.svg)](https://david-dm.org/huridocs/uwazi#info=devDependencies)
[![dependency Status](https://david-dm.org/huridocs/uwazidocs/status.svg)](https://david-dm.org/huridocs/uwazi#info=dependencies)
[![CircleCI](https://circleci.com/gh/huridocs/uwazi.svg?style=shield)](https://circleci.com/gh/huridocs/uwazi)
[![Maintainability](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/maintainability)](https://codeclimate.com/github/huridocs/uwazi/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/test_coverage)](https://codeclimate.com/github/huridocs/uwazi/test_coverage)


There are important stories within your documents. Uwazi helps you tell them. Uwazi is a free, open-source solution for organizing, analyzing and publishing your documents.

[Uwazi](https://www.uwazi.io/) | [HURIDOCS](https://huridocs.org/)

Read the [user guide](https://github.com/huridocs/uwazi/wiki)

Intallation guide
=================

  * [Dependencies](#dependencies)
  * [Production](#production)
    * [Production Configuration](#production-configuration-advanced)
    * [Production Build](#production-build)
    * [Initial State](#initial-state)
    * [Production Run](#production-run)
    * [Upgrading Uwazi](#upgrading-uwazi-migrations)
  * [Development](#development)
    * [Development Run](#development-run)
    * [Testing](#testing)
      * [Unit and Integration tests](#unit-and-integration-tests)
      * [End to End (e2e)](#end-to-end-e2e)

# Dependencies

- **NodeJs 8.11.x** For ease of update, use nvm: https://github.com/creationix/nvm
- **ElasticSearch 5.5.x** https://www.elastic.co/guide/en/elasticsearch/reference/5.5/install-elasticsearch.html (Make sure to have 5.5, some sections of the instructions use 5.x which would install a different version). Please note that ElasticSearch requires java.
- **MongoDB 3.4.x** https://docs.mongodb.com/v3.4/installation/ (there are known issues with 3.6, please ensure 3.4)
- **Yarn** https://yarnpkg.com/en/docs/install
- **pdftotext (Poppler)** tested to work on version 0.26 but its recommended to use the latest available for your platform https://poppler.freedesktop.org/

Before anything else you will need to install the application dependencies. 

If you want to use the latest development code:
```
$ git clone https://github.com/huridocs/uwazi.git
$ cd uwazi
$ yarn install
```
If you just want to only use the latest stable release (recommended for production):
```
$ git clone -b master --single-branch https://github.com/huridocs/uwazi.git
$ cd uwazi
$ yarn install
```

# Production

### Production Build

```
$ yarn production-build
```

The first time you run Uwazi, you will need to initialize the database with its default blank values. Do no run this command for existing projects, as this will erase the entire database. Note that from this point you need ElasticSearch and MongoDB running. 
```
$ yarn blank-state
```
Then start the server by typing:
```
$ yarn run-production
```
By default, Uwazi runs on localhost on the port 3000. So point your browser to http://localhost:3000 and authenticate yourself with the default username "admin" and password "change this password now".

Check out the user guide for [more configuration options](https://github.com/huridocs/uwazi/wiki/Install-Uwazi-on-your-server).

### Upgrading Uwazi and data migrations

Updating Uwazi is pretty straight forward using git:
```
$ cd uwazi
$ git pull
$ yarn install
$ yarn migrate
$ yarn production-build
$ yarn run-production
```
- If you are not using git, just download and overwrite the code in the Uwazi directory. 
- 'yarn install' will automatically add, remove or replace any changes in module dependecies.
- 'yarn migrate' will track your last data version and, if needed, run a script over your data to modify it so that is up to date with your Uwazi version.

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
$ yarn test
```

This will run the entire test suite, both on server and client apps.

#### End to End (e2e)

For End-to-End testing, we have a full set of fixtures that test the overall functionality.  Be advised that, for the time being, these tests are run ON THE SAME DATABASE as the default database (uwazi_developmet), so running these tests will DELETE any exisisting data and replace it with the testing fixtures.  DO NOT RUN ON PRODUCTION ENVIRONMENTS!

Running end to end tests require a running Uwazi app.

```
$ yarn hot
```

On a different console tab, run
```
$ yarn e2e
```

Note that if you already have an instance running, this will likely throw an error of ports already been used.  Only one instance of Uwazi may be run in a the same port at the same time.

### Default login

The application's default log in is admin / change this password now 

Note the subtle nudge ;)
