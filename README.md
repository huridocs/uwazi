[![devDependency Status](https://david-dm.org/huridocs/uwazidocs/dev-status.svg)](https://david-dm.org/huridocs/uwazidocs#info=devDependencies)
[![dependency Status](https://david-dm.org/huridocs/uwazidocs/status.svg)](https://david-dm.org/huridocs/uwazidocs#info=dependencies)

#Global dependencies

- **NodeJs 4.2.6**
- **Elasticsearch / Logstash** (latest version, 2.1.1)
    - OSX
      - `brew update`
      - `brew install elasticsearch`
      - after installation brew will provide instructions on how to launch elasticsearch.
      - `brew install logstash`
      - to run logstash -> `logstash agent -f logstash.conf` the config file is in the project root
- **Docsplit**
    - OSX
      - install ruby `brew install ruby`
      - `gem install docsplit`
      - install non optional dependencies for docsplit -> [https://documentcloud.github.io/docsplit/](https://documentcloud.github.io/docsplit/)
    - UBUNTU 
      - install ruby `sudo apt-get install ruby-full`
      - `gem install docsplit`
      - install non optional dependencies for docsplit -> [https://documentcloud.github.io/docsplit/](https://documentcloud.github.io/docsplit/)

#Development

- launch application: `foreman start`, the app will be available after few seconds on localhost:3000
- test api: `node test_api.js`
- test react: `karma start`
