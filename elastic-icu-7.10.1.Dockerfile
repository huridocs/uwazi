FROM elasticsearch:7.10.1
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
