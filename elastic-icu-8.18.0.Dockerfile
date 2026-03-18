FROM elasticsearch:9.3.1
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
