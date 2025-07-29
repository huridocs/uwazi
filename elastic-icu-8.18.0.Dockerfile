FROM elasticsearch:8.18.0
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
