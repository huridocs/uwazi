#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# Comprobamos si hay parámetros
if [ $# -gt 0 ]; then
    echo -e "\nHay params"

    case $# in
        1)
            echo -e "\n1 param y es: $1"
            if [ $1 == "--force" ]; then
                # Si es force seteamos la FORCE_FLAG
                FORCE_FLAG=$1
                echo -e "\nFORCE_FLAG ahora vale: $FORCE_FLAG"
            
                # Seteamos DB y HOST por defecto
                DB=${DATABASE_NAME:-uwazi_development}
            else
                # Asignamos el valor a DB
                DB=$1
            fi

            # Seteamos HOST por defecto
            HOST=${DBHOST:-127.0.0.1}

            echo -e "\nDB ahora vale: $DB"
            echo -e "\nHOST ahora vale: $HOST"

            # exit 0
            ;;
        2)
            echo -e "\n2 params"
            if [ $1 == "--force" ]; then
                # Seteamos la FORCE_FLAG
                FORCE_FLAG=$1
                
                # Asignamos el valor a DB
                DB=$2
            else
                # Seteamos la FORCE_FLAG
                FORCE_FLAG=$2

                # Asignamos el valor a DB
                DB=$1
            fi
            echo -e "\nFORCE_FLAG ahora vale: $FORCE_FLAG"
            
            # Seteamos HOST por defecto
            HOST=${DBHOST:-127.0.0.1}

            echo -e "\nDB ahora vale: $DB"
            echo -e "\nHOST ahora vale: $HOST"

            # exit 0
            ;;
        3)
            echo -e "\n3 params"

            if [ $1 == "--force" ]; then
                echo -e "Force es el primero"
                # Seteamos la FORCE_FLAG
                FORCE_FLAG=$1

                # Asignamos el valor a DB
                DB=$2

                # Asignamos el valor a HOST
                HOST=$3

            elif [ $2 == "--force" ]; then
                echo -e "Force es el segundo"
                # Seteamos la FORCE_FLAG
                FORCE_FLAG=$2

                # Asignamos el valor a DB
                DB=$1

                # Asignamos el valor a HOST
                HOST=$3
            else
                # Seteamos la FORCE_FLAG
                echo -e "Force es el tercero"
                FORCE_FLAG=$3

                # Asignamos el valor a DB
                DB=$1

                # Asignamos el valor a HOST
                HOST=$2
            fi

            echo -e "\nFORCE_FLAG ahora vale: $FORCE_FLAG"
            echo -e "\nDB ahora vale: $DB"
            echo -e "\nHOST ahora vale: $HOST"

            # exit 0
            ;;
    esac 
else
    echo -e "\nNo hay params"
    # Se setean db y host por defecto
    
    DB=${DATABASE_NAME:-uwazi_development}
    HOST=${DBHOST:-127.0.0.1}

    echo -e "\nDB ahora vale: $DB"
    echo -e "\nHOST ahora vale: $HOST"

    # exit 0
fi

echo -e "\nANTES DE HACER LAS OPERACIONES: "            
echo -e "\nFORCE_FLAG es: $FORCE_FLAG"
echo -e "\nDB es: $DB"
echo -e "\nHOST es: $HOST"

recreate_database() {
    mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
    mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

    INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
    INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex

    exit 0
}

mongo_indexof_db=$(mongosh --quiet -host $HOST --eval 'db.getMongo().getDBNames().indexOf("'$DB'")')

if [ $mongo_indexof_db -ne "-1" ]; then    
    if [ -z "$FORCE_FLAG" ]; then
        echo -e "\n$DB already database exists. It will not be deleted."
        exit 2    
    else
        recreate_database
    fi
else
    recreate_database
fi

