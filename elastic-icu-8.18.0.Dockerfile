FROM elasticsearch:8.19.13
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
