#!/bin/bash

# Performance Benchmark Runner
# Reproduces the ES query bottleneck investigation

set -e

ENTITY_ID="${1:-egfjcp0mp1w}"
NUM_REQUESTS="${2:-5}"
LOG_FILE="perf_logs_benchmark.txt"

echo "========================================="
echo "ElasticSearch Query Performance Benchmark"
echo "========================================="
echo ""
echo "Entity ID: $ENTITY_ID"
echo "Number of requests: $NUM_REQUESTS"
echo "Log file: $LOG_FILE"
echo ""

# Check if server is running
if ! pgrep -f "node.*hot" > /dev/null; then
    echo "❌ Server is not running!"
    echo "Start with: yarn hot > perf_logs.txt 2>&1 &"
    exit 1
fi

echo "✅ Server is running"

# Check if ES is running
if ! curl -s 'http://localhost:9200/_cluster/health' > /dev/null 2>&1; then
    echo "❌ ElasticSearch is not running!"
    exit 1
fi

echo "✅ ElasticSearch is running"

# Get ES stats
ES_DOCS=$(curl -s 'http://localhost:9200/uwazi_development/_count' | grep -oP '"count":\K\d+' || echo "unknown")
echo "📊 Index document count: $ES_DOCS"
echo ""

# Run benchmark
echo "🚀 Running benchmark with $NUM_REQUESTS requests..."
echo ""

for i in $(seq 1 $NUM_REQUESTS); do
    echo -n "Request $i/$NUM_REQUESTS... "
    
    START_TIME=$(date +%s%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        "http://localhost:3000/entity/$ENTITY_ID" \
        -H 'Accept: text/html')
    END_TIME=$(date +%s%N)
    
    ELAPSED=$((($END_TIME - $START_TIME) / 1000000))
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ ${ELAPSED}ms (HTTP $HTTP_CODE)"
    else
        echo "❌ HTTP $HTTP_CODE"
    fi
    
    sleep 2
done

echo ""
echo "📈 Extracting performance metrics from server logs..."
echo ""

# Find the most recent log file
if [ -f "perf_logs.txt" ]; then
    ACTUAL_LOG_FILE="perf_logs.txt"
elif [ -f "../perf_logs.txt" ]; then
    ACTUAL_LOG_FILE="../perf_logs.txt"
else
    echo "⚠️  Warning: Could not find perf_logs.txt"
    echo "Performance metrics may not be available"
    ACTUAL_LOG_FILE=""
fi

if [ -n "$ACTUAL_LOG_FILE" ]; then
    echo "=== ElasticSearch Query Performance ==="
    echo ""
    
    # Get last N ES query times
    echo "ES Query Times (last $NUM_REQUESTS):"
    grep "ElasticSearch search.search" "$ACTUAL_LOG_FILE" | tail -$NUM_REQUESTS | \
        sed 's/\[1\] //' | \
        awk -F'[: ]' '{
            for(i=1;i<=NF;i++) {
                if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") {
                    time=$i
                }
                if($(i-1) == "Results:") {
                    results=$i
                }
            }
            printf "  %s ms - Results: %s\n", time, results
        }'
    
    echo ""
    
    # Calculate average
    AVG_TIME=$(grep "ElasticSearch search.search" "$ACTUAL_LOG_FILE" | tail -$NUM_REQUESTS | \
        sed 's/\[1\] //' | \
        awk -F'[: ]' '{
            for(i=1;i<=NF;i++) {
                if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") {
                    print $i
                }
            }
        }' | \
        awk '{sum+=$1; count++} END {if(count>0) printf "%.2f", sum/count; else print "N/A"}')
    
    echo "📊 Average ES query time: ${AVG_TIME}ms"
    
    # Check for aggregations
    HAS_AGGS=$(grep "Has aggregations:" "$ACTUAL_LOG_FILE" | tail -1 | awk '{print $NF}')
    if [ "$HAS_AGGS" = "true" ]; then
        echo "⚠️  Aggregations are ENABLED (this is the bug!)"
    else
        echo "✅ Aggregations are disabled"
    fi
    
    # Get ID count
    ID_COUNT=$(grep "Querying ES with" "$ACTUAL_LOG_FILE" | tail -1 | \
        sed 's/\[1\] //' | \
        awk '{
            for(i=1;i<=NF;i++) {
                if($(i) == "with" && $(i+2) == "entity") {
                    print $(i+1)
                }
            }
        }')
    echo "🔢 Entity IDs queried: $ID_COUNT"
    
    echo ""
    echo "=== Query Profile ==="
    echo ""
    
    # Show profiling data if available
    if grep -q "\[PERF\]\[ES-PROFILE\]" "$ACTUAL_LOG_FILE"; then
        grep "\[PERF\]\[ES-PROFILE\]" "$ACTUAL_LOG_FILE" | tail -20 | sed 's/\[1\] //'
    else
        echo "No profiling data found (query may not have triggered profiling threshold)"
    fi
    
    echo ""
    echo "=== Full Timing Breakdown ==="
    echo ""
    grep "\[PERF\]\[RelationshipsSearch\]" "$ACTUAL_LOG_FILE" | tail -10 | sed 's/\[1\] //'
fi

echo ""
echo "✅ Benchmark complete!"
echo ""
echo "📝 For full investigation details, see:"
echo "   performance_analysis/BOTTLENECK_INVESTIGATION.md"
echo ""
