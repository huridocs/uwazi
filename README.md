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
