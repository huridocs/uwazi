FROM elasticsearch:7.11.2
RUN /usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
