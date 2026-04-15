FROM elasticsearch:8.19.14
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
