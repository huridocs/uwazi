<!-- @format -->

![Uwazi Logo](https://uwazi.io/assets/16369950628097kcvfquj74a.svg)

![Uwazi CI](https://github.com/huridocs/uwazi/workflows/Uwazi%20CI/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/maintainability)](https://codeclimate.com/github/huridocs/uwazi/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/test_coverage)](https://codeclimate.com/github/huridocs/uwazi/test_coverage)

Uwazi is a flexible database application to capture and organise collections of information with a particular focus on document management. HURIDOCS started Uwazi and is supporting dozens of human rights organisations globally to use the tool.

[Uwazi](https://www.uwazi.io/) | [HURIDOCS](https://huridocs.org/)

Read the [user guide](https://uwazi.readthedocs.io/en/latest/)

# Installation guide

- [Dependencies](#dependencies)
- [Production](#production)
- [Development](#development)

# Dependencies

Before anything else you will need to install the application dependencies:

- **NodeJs 14.18.3** For ease of update, use nvm: https://github.com/creationix/nvm.
- **ElasticSearch 7.10.0** https://www.elastic.co/downloads/past-releases/elasticsearch-7-10-0 Please note that ElasticSearch requires java. Follow the instructions to install the package manually, you also probably need to disable ml module in the ElasticSearch config file:
  `xpack.ml.enabled: false`
- **ICU Analysis Plugin (recommended)** [installation](https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-icu.html#analysis-icu) Adds support for number sorting in texts and solves other language sorting nuances. This option is activated by setting the env var USE_ELASTIC_ICU=true before running the server (defaults to false/unset).
- **MongoDB 4.2** https://docs.mongodb.com/v4.2/installation/ . If you have a previous version installed, please follow instructions on how to [upgrade here](https://docs.mongodb.com/manual/release-notes/4.2-upgrade-standalone/).
- **Yarn** https://yarnpkg.com/en/docs/install.
- **pdftotext (Poppler)** tested to work on version 0.86 but its recommended to use the latest available for your platform https://poppler.freedesktop.org/. Make sure to **install libjpeg-dev** if you build from source.

and change some global settings:

```
$ npm config set scripts-prepend-node-path auto
```

# Production

### Install/upgrade procedure

1. Download and unpack the [latest stable](https://github.com/huridocs/uwazi/releases) code for production installs.
2. Shutdown Uwazi if it is already running.
3. `$ cd uwazi`.
4. `$ yarn install` will download all node modules, it may take a while.
5. `$ yarn blank-state` **important note**: the first time you run Uwazi, you will need to initialize the database with its default blank values. Do not run this command if you are upgrading existing projects as it will erase the entire database. Note that from this point on you need ElasticSearch and MongoDB running.
6. `$ ./install.sh [destination_path]` if no `destination_path` is provided it will default to `./prod`.
7. Start the server with `$ node [destination_path]/server.js`.

By default, Uwazi runs on localhost on the port 3000, so point your browser to http://localhost:3000 and authenticate yourself with the default username "admin" and password "change this password now".

It is advisable to create your own system service configuration. Check out the user guide for [more configuration options](https://github.com/huridocs/uwazi/wiki/Install-Uwazi-on-your-server).

# Development

If you want to use the latest development code:

```
$ git clone https://github.com/huridocs/uwazi.git
$ cd uwazi
$ yarn install
$ yarn blank-state
```

If you want to download the Uwazi repository and also download the included git submodules, such as the `uwazi-fixtures`, which is used for running the end-to-end testing:

```
$ git clone --recurse-submodules https://github.com/huridocs/uwazi.git
$ cd uwazi
$ yarn install
```

If the main Uwazi repository had already been cloned/downloaded and now you want to load its sub-modules, you can run

```
$ git submodule update --init
```

There may be an issue with pngquant not running correctly. If you encounter this issue, you are probably missing library **libpng-dev**. Please run:

```
$ sudo rm -rf node_modules
$ sudo apt-get install libpng-dev
$ yarn install
```

### Development Run

```
$ yarn hot
```

This will launch a webpack server and nodemon app server for hot reloading any changes you make.

### Webpack server

```
$ yarn webpack-server
```

This will launch a webpack server. You can also pass `--analyze`to get a detailed info of the webpack build.

### Testing

#### Unit and Integration tests

We test using the JEST framework (built on top of Jasmine). To run the unit and integration tests, execute

```
$ yarn test
```

This will run the entire test suite, both on server and client apps.

If the API tests timeout, the issue might be with mongodb-memory-server. See https://github.com/nodkz/mongodb-memory-server/issues/204. Memory server explicitly depends on a version of MongoDB that depends on libcurl3, but Debian 10 and other OS's come with libcurl4 installed instead.

To fix this, update node_modules/mongodb-memory-server-core/lib/util/MongoBinary.js#70.
Set `exports.LATEST_VERSION = '4.3.3'` or a similar new version.

#### End to End (e2e)

For End-to-End testing, we have a full set of fixtures that test the overall functionality. Be advised that, for the time being, these tests are run ON THE SAME DATABASE as the default database (uwazi_developmet), so running these tests will DELETE any exisisting data and replace it with the testing fixtures. DO NOT RUN ON PRODUCTION ENVIRONMENTS!

Running end to end tests require a running Uwazi app.

Running tests with Nightmare

```
$ yarn hot
```

On a different console tab, run

```
$ yarn e2e
```

Running tests with Puppeteer

```
$ DATABASE_NAME=uwazi_e2e INDEX_NAME=uwazi_e2e yarn hot
```

On a different console tab, run

```
$ yarn e2e-puppeteer
```

Note that if you already have an instance running, this will likely throw an error of ports already been used. Only one instance of Uwazi may be run in a the same port at the same time.

E2E Tests depend on electron. If something appears to not be working, please run `node_modules/electron/dist/electron --help` to check for problems.

### Default login

The application's default log in is admin / change this password now

Note the subtle nudge ;)

# Docker

Infrastructure dependencies (ElasticSearch, ICU Analysis Plugin and MongoDB) can be installed via Docker Compose.  ElasticSearch container will claim 2Gb of memory so be sure your Docker Engine is alloted at least 3Gb of memory (for Mac and Windows users).

```shell
$ docker-compose up -d
```
