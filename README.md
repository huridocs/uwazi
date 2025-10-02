<!-- @format -->

![Uwazi Logo](https://uwazi.io/assets/16369950628097kcvfquj74a.svg)

![Uwazi CI](https://github.com/huridocs/uwazi/workflows/Uwazi%20CI/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/maintainability)](https://codeclimate.com/github/huridocs/uwazi/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8c98a251ca64daf434f2/test_coverage)](https://codeclimate.com/github/huridocs/uwazi/test_coverage)

Uwazi is a flexible database application to capture and organise collections of information with a particular focus on document management. HURIDOCS started Uwazi and is supporting dozens of human rights organisations globally to use the tool.

[Uwazi](https://www.uwazi.io/) | [HURIDOCS](https://huridocs.org/)

Read the [user guide](https://uwazi.io/page/9852italrtk/support)

# Installation guide

- [Dependencies](#dependencies)
- [Production](#production)
- [Development](#development)

# Dependencies

Before anything else you will need to install the application dependencies:

- **NodeJs 20.9.0** For ease of update, use [nvm](https://github.com/creationix/nvm).
- [**ElasticSearch 8.18.0**](https://www.elastic.co/downloads/past-releases/elasticsearch-8-18-0) Please note that ElasticSearch requires Java. Follow the instructions to install the package manually, you also probably need to disable ml module in the ElasticSearch config file:
  `xpack.ml.enabled: false`
- [**ICU Analysis Plugin (recommended)**](https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-icu.html#analysis-icu) Adds support for number sorting in texts and solves other language sorting nuances. This option is activated by setting the env var USE_ELASTIC_ICU=true before running the server (defaults to false/unset).
- [**MongoDB 7.0.24**](https://www.mongodb.com/docs/v5.0/installation/) The MongoDB installation needs to be configured as a Replica Set. It can be a single-node replica set, but Replica Set must be [initialized](https://www.mongodb.com/docs/v6.0/tutorial/deploy-replica-set/). If you have a previous version installed, please follow the instructions on how to [upgrade here](https://www.mongodb.com/docs/manual/release-notes/5.0-upgrade-standalone/).
- [**mongosh**](https://www.mongodb.com/docs/mongodb-shell/) The new mongosh dependency needs to be added.
- [**Yarn**](https://yarnpkg.com/en/docs/install)
- **pdftotext (Poppler)** tested to work on version 0.86 but it's recommended to use the [latest available for your platform](https://poppler.freedesktop.org/). Make sure to **install libjpeg-dev** if you build from source.

# Production

[Install/upgrade procedure](./SELF_HOSTED_INSTRUCTIONS.md)

# Development

If you want to use the latest development code:

```
$ git clone https://github.com/huridocs/uwazi.git
$ cd uwazi
$ yarn install
$ yarn blank-state
```

There may be an issue with pngquant not running correctly. If you encounter this issue, you are probably missing the library **libpng-dev**. Please run:

```
$ sudo rm -rf node_modules
$ sudo apt-get install libpng-dev
$ yarn install
```

### Docker

Infrastructure dependencies (ElasticSearch, ICU Analysis Plugin, MongoDB, Redis and Minio (S3 storage) can be installed and run via Docker Compose. ElasticSearch container will claim 2Gb of memory so be sure your Docker Engine is alloted at least 3Gb of memory (for Mac and Windows users).

```shell
$ ./run start
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

This will launch a webpack server. You can also pass `--analyze`to get detailed info on the webpack build.

### Testing

#### Unit and Integration tests

We test using the JEST framework (built on top of Jasmine). To run the unit and integration tests, execute

```
$ yarn test
```

This will run the entire test suite, both on server and client apps.

Some suites need MongoDB configured in Replica Set mode to run properly. The provided Docker Compose file runs MongoDB in Replica Set mode and initializes the cluster automatically, if you are using your own mongo installation Refer to [MongoDB's documentation](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/#initiate-the-replica-set) for more information.

There are also Cypress components tests. It's recommended that Cypress tests are run with Chrome or Chrome based browsers.

You can run individual tests with the Cypress UI:

```
$ yarn cypress
```

or you can run tests in headless mode:

```
$ yarn cy-components --browser chrome
```

### End-to-End testing (e2e)

Running end-to-end tests requires a running Uwazi app. For End-to-End testing, we have a full set of fixtures that test the overall functionality. **It's not advised to run these tests on production environments**, since an incorrectly configured run can have unwanted effects on the production database.

Note that if you already have an instance running, this will likely throw an error of ports already being used. Only one instance of Uwazi may be run in the same port at the same time.

The Uwazi APP needs to run on a specific database and with a specific ElasticSearch index. This is configured via environment variables when starting the application.

#### Running tests with Puppeteer (legacy)

Start UWazi:

```
$ DATABASE_NAME=uwazi_e2e INDEX_NAME=uwazi_e2e yarn hot
```

On a different console tab, run:

```
$ yarn e2e-puppeteer
```

This will trigger a run of all the Puppeteer tests.

You can run test individually:

```
yarn e2e-puppeteer-all path/to/test.test.ts
```

#### Running tests with Cypress

Start Uwazi:

```
$ DATABASE_NAME=uwazi_e2e INDEX_NAME=uwazi_e2e yarn hot
```

On a different console tab, run:

```
$ yarn cypress
```

This will open the Cypress interface where you can select the tests to run. It's recommended that Cypress tests are run with Chrome or Chrome based browsers.

You can run tests in headless mode, and run individual suites via:

```
$ yarn cy-e2e --browser chrome --spec path/to/test.cy.ts
```

Cypress tests that use our Information Extraction features need to run Uwazi together with a [dummy service](https://github.com/huridocs/dummy_extractor_services) that mimics the external services needed for the features.

To run these tests you also need to add the following environment variables when running Uwazi:

```
$ EXTERNAL_SERVICES=true FEATURE_FLAG_PARAGRAPH_EXTRACTION=true PARAGRAPH_EXTRACTION_URL=http://localhost:5051 DATABASE_NAME=uwazi_e2e INDEX_NAME=uwazi_e2e yarn hot
```

### Default login

The application's default login is admin / change this password now

Note the subtle nudge ;)

## System Requirements

- For big files with a small database footprint (such as video, audio and images) you'll need more HD space than CPU or RAM
- For text documents you should consider some decent RAM as ElasticSearch is pretty greedy on memory for full text search

The bare minimum you need to be able to run Uwazi on-prem without bottlenecks is:

- 4 GB of RAM (reserve 2 for Elastic and 2 for everything else)
- 2 CPU cores
- 20 GB of disk space

For development:

- 8GB of RAM (depending on whether the services are running)
- 4 CPU cores
- 20 GB of disk space
