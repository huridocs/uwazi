FROM elasticsearch:7.17.6
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
