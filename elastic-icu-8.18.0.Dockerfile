FROM elasticsearch:8.18.8
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
