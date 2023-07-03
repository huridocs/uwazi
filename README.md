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

- **NodeJs >= 18** For ease of update, use nvm: https://github.com/creationix/nvm.
- **ElasticSearch 7.17.6** https://www.elastic.co/downloads/past-releases/elasticsearch-7-17-6 Please note that ElasticSearch requires java. Follow the instructions to install the package manually, you also probably need to disable ml module in the ElasticSearch config file:
  `xpack.ml.enabled: false`
- **ICU Analysis Plugin (recommended)** [installation](https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-icu.html#analysis-icu) Adds support for number sorting in texts and solves other language sorting nuances. This option is activated by setting the env var USE_ELASTIC_ICU=true before running the server (defaults to false/unset).
- **MongoDB 4.2** https://docs.mongodb.com/v4.2/installation/ . If you have a previous version installed, please follow instructions on how to [upgrade here](https://docs.mongodb.com/manual/release-notes/4.2-upgrade-standalone/). The new mongosh dependency needs to be added [installation](https://www.mongodb.com/docs/mongodb-shell/).
- **Yarn** https://yarnpkg.com/en/docs/install.
- **pdftotext (Poppler)** tested to work on version 0.86 but its recommended to use the latest available for your platform https://poppler.freedesktop.org/. Make sure to **install libjpeg-dev** if you build from source.

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

This will launch a webpack server. You can also pass `--analyze`to get a detailed info of the webpack build.

### Testing

#### Unit and Integration tests

We test using the JEST framework (built on top of Jasmine). To run the unit and integration tests, execute

```
$ yarn test
```

This will run the entire test suite, both on server and client apps.

Some suites need MongoDB configured in Replica Set mode to run properly. The provided Docker Compose file runs MongoDB in Replica Set mode and initializes the cluster automatically, if you are using your own mongo installation Refer to [MongoDB's documentation](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/#initiate-the-replica-set) for more information.

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

### Default login

The application's default log in is admin / change this password now

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
