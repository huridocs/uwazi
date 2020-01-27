STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep "js$")
if [ "$STAGED_FILES" = "" ]; then
    exit 0
fi

PASS=true

for FILE in $STAGED_FILES
do
    yarn eslint --quiet "$FILE"

    if [ "$?" == 0 ]; then
        echo "\t\033[32mESLint Passed: $FILE\033[0m"
    else
        echo "\t\033[41mESLint Failed: $FILE\033[0m"
        PASS=false
    fi

    yarn prettier "$FILE"

    if [ "$?" == 0 ]; then
        echo "\t\033[32mPrettier  Passed: $FILE\033[0m"
    else
        echo "\t\033[41mPrettier Failed: $FILE\033[0m"
        PASS=false
    fi
done

yarn test --bail --findRelatedTests $STAGED_FILES
if [ "$?" == 0 ]; then
    echo "\t\033[32mJest Tests Passed\033[0m"
else
    echo "\t\033[41mJest Tests Failed\033[0m"
    PASS=false
fi
