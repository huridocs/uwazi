#!/bin/bash

# Search Performance Benchmark Runner
# Tests search query performance with configurable parameters

set -e

SEARCH_TERM="${1:-human rights}"
NUM_REQUESTS="${2:-5}"
LOG_FILE="perf_logs_search.txt"

echo "========================================="
echo "Search Query Performance Benchmark"
echo "========================================="
echo ""
echo "Search term: \"$SEARCH_TERM\""
echo "Number of requests: $NUM_REQUESTS"
echo "Log file: $LOG_FILE"
echo ""

# Check if server is running
if ! pgrep -f "node.*hot" > /dev/null && ! pgrep -f "node.*prod/server.js" > /dev/null; then
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

# URL encode the search term
ENCODED_TERM=$(echo "$SEARCH_TERM" | jq -sRr @uri)

# Run benchmark
echo "🚀 Running search benchmark with $NUM_REQUESTS requests..."
echo ""

TOTAL_TIME=0
SUCCESS_COUNT=0

for i in $(seq 1 $NUM_REQUESTS); do
    echo -n "Request $i/$NUM_REQUESTS... "
    
    START_TIME=$(date +%s%N)
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "http://localhost:3000/api/search?searchTerm=${ENCODED_TERM}&limit=30&from=0" \
        -H 'Accept: application/json')
    END_TIME=$(date +%s%N)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    ELAPSED=$((($END_TIME - $START_TIME) / 1000000))
    TOTAL_TIME=$(($TOTAL_TIME + $ELAPSED))
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Try to extract result count
        RESULT_COUNT=$(echo "$BODY" | jq -r '.rows | length' 2>/dev/null || echo "?")
        echo "✅ ${ELAPSED}ms (HTTP $HTTP_CODE, $RESULT_COUNT results)"
        SUCCESS_COUNT=$(($SUCCESS_COUNT + 1))
    else
        echo "❌ HTTP $HTTP_CODE"
    fi
    
    sleep 1
done

echo ""
echo "📈 Extracting performance metrics from server logs..."
echo ""

# Find the most recent log file
if [ -f "perf_logs.txt" ]; then
    ACTUAL_LOG_FILE="perf_logs.txt"
elif [ -f "../perf_logs.txt" ]; then
    ACTUAL_LOG_FILE="../perf_logs.txt"
elif [ -f "../../perf_logs.txt" ]; then
    ACTUAL_LOG_FILE="../../perf_logs.txt"
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
    
    # Calculate average ES time
    AVG_ES_TIME=$(grep "ElasticSearch search.search" "$ACTUAL_LOG_FILE" | tail -$NUM_REQUESTS | \
        sed 's/\[1\] //' | \
        awk -F'[: ]' '{
            for(i=1;i<=NF;i++) {
                if($i ~ /^[0-9]+\.[0-9]+$/ && $(i+1) == "ms") {
                    print $i
                }
            }
        }' | \
        awk '{sum+=$1; count++} END {if(count>0) printf "%.2f", sum/count; else print "N/A"}')
    
    echo "📊 Average ES query time: ${AVG_ES_TIME}ms"
    
    # Check query type (query_string vs simple_query_string)
    QUERY_TYPE=$(grep "Using search type:" "$ACTUAL_LOG_FILE" | tail -1 | awk '{print $NF}' || echo "unknown")
    if [ "$QUERY_TYPE" = "query_string" ]; then
        echo "✅ Query type: query_string (advanced syntax)"
    elif [ "$QUERY_TYPE" = "simple_query_string" ]; then
        echo "ℹ️  Query type: simple_query_string (fallback)"
    fi
    
    # Show query validation result
    if grep -q "Query validation result:" "$ACTUAL_LOG_FILE"; then
        VALID=$(grep "Query validation result:" "$ACTUAL_LOG_FILE" | tail -1 | grep -o "valid: [a-z]*" | awk '{print $2}')
        if [ "$VALID" = "true" ]; then
            echo "✅ Search query syntax: valid"
        else
            echo "⚠️  Search query syntax: invalid (using fallback)"
        fi
    fi
    
    echo ""
    echo "=== Search Operation Breakdown ==="
    echo ""
    grep "\[PERF\]\[Search\]" "$ACTUAL_LOG_FILE" | tail -20 | sed 's/\[1\] //'
    
    echo ""
    echo "=== Full-Text Search Details ==="
    echo ""
    grep "Full-text search\|fullText" "$ACTUAL_LOG_FILE" | tail -10 | sed 's/\[1\] //'
fi

# Client-side timing summary
echo ""
echo "=== Client-Side Performance ==="
echo ""
AVG_CLIENT_TIME=$(echo "scale=2; $TOTAL_TIME / $NUM_REQUESTS" | bc)
echo "Average request time (client): ${AVG_CLIENT_TIME}ms"
echo "Successful requests: $SUCCESS_COUNT/$NUM_REQUESTS"

if [ "$SUCCESS_COUNT" -gt 0 ]; then
    echo "✅ Success rate: $(echo "scale=1; $SUCCESS_COUNT * 100 / $NUM_REQUESTS" | bc)%"
fi

echo ""
echo "✅ Search benchmark complete!"
echo ""
echo "📝 For detailed analysis, run:"
echo "   grep 'ElasticSearch search.search' $ACTUAL_LOG_FILE | tail -50"
echo "   python3 performance_analysis/scripts/analyze_backend.py $ACTUAL_LOG_FILE"
echo ""
echo "💡 Try these search variations:"
echo "   ./performance_analysis/scripts/run_search_benchmark.sh 'human rights' 5"
echo "   ./performance_analysis/scripts/run_search_benchmark.sh '\"general assembly\"' 5"
echo "   ./performance_analysis/scripts/run_search_benchmark.sh 'climate AND change' 5"
echo "   ./performance_analysis/scripts/run_search_benchmark.sh 'fullText:(peace)' 5"
echo ""
