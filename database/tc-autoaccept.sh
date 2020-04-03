#! /bin/bash
UWAZI=http://localhost:3000
# The TC server model name, composed of <databasename>-<thesaurusname>,
# e.g. planinternational-affectedpersons.
MODEL=dbname-modelname
USER=admin
PASSWORD=admin

curl --request POST \
     --url ${UWAZI}/api/login \
     --header 'content-type: application/json' \
     --data "{\"username\": \"${USER}\",\"password\": \"${PASSWORD}\"}" \
     --cookie-jar /tmp/cookiejar || exit 1
echo 

curl --request POST \
     --url "${UWAZI}/api/tasks?name=AutoAcceptTopicClassification&type=TopicClassificationSync" \
     --header 'content-type: application/json' \
     --header 'X-Requested-With: XMLHttpRequest' \
     --data "{\"mode\":\"autoaccept\",\"noDryRun\":true,\"overwrite\":true,\"autoAcceptConfidence\":0,\"model\":\"${MODEL}\"}" \
     --cookie /tmp/cookiejar || exit 1
echo 

while :
do
  sleep 1
  MSG=`curl -s --request GET \
       --url ${UWAZI}/api/tasks?name=AutoAcceptTopicClassification`
  echo ${MSG}
  if [[ ${MSG} == "{\"state\":\"done\""* ]]; then
    break
  fi
  if [[ ${MSG} == "{\"state\":\"undefined\""* ]]; then
    echo "Uwazi may have restarted, you need to restart tc-autoaccept.sh as well."
    break
  fi
  if [[ ${MSG} == "{\"state\":\"failed\""* ]]; then
    exit 1
  fi
  if [[ ${MSG} == "" ]]; then
    echo "No status - is Uwazi up at ${UWAZI}? Restarting this tool will re-attach to the running task."
    break
  fi
done
