## First one time set up
Make sure you have running uwazi [dependencies](https://github.com/huridocs/uwazi#dependencies).

First time installing uwazi we are going to create a basic folder structure to deploy the code and the folders that will contain potential uploaded or created files by uwazi.
create this folder structure
```
mkdir -p uwazi/log uwazi/uploaded_documents uwazi/custom_uploads uwazi/temporal_files
.
├── /home/user/uwazi
│   ├── log/
│   ├── uploaded_documents/
│   ├── custom_uploads/
│   ├── temporal_files/
```
- From with in uwazi folder download latest release tar 
- ```wget https://github.com/huridocs/uwazi/releases/latest/download/uwazi.tgz```
- unpack, this will create a prod folder where latest uwazi release is
- ```tar xvf uwazi.tgz```
- rename to latest and delete tar
- ```mv prod latest && rm uwazi.tgz```
- you should have now 
```
.
├── uwazi
│   ├── latest/
│   ├── log/
│   ├── uploaded_documents/
│   ├── custom_uploads/
│   ├── temporal_files/
```
- From with in uwazi/latest create a blank state with the database name you want, (default: uwazi_development)
- ```NODE_ENV=production yarn blank-state my_db_name```

## Update uwazi to a new release
- Rename or delete previous latest folder
- From with in uwazi folder download latest release tar 
- ```wget https://github.com/huridocs/uwazi/releases/latest/download/uwazi.tgz```
- ```tar xvf uwazi.tgz```
- ```mv prod latest && rm uwazi.tgz```
- From with in uwazi/latest run migrations and reindex
- ```NODE_ENV=production yarn migrate-and-reindex```

## Run uwazi
You should be able to run uwazi now in production mode
```DATABASE_NAME=my_db_name INDEX_NAME=my_db_name NODE_ENV=production FILES_ROOT_PATH=/home/user/uwazi/ node server.js```

By default, Uwazi runs on localhost on the port 3000, so point your browser to http://localhost:3000 and authenticate yourself with the default username "admin" and password "change this password now".
It is advisable to create your own system service configuration. Check out the user guide for [more configuration options](https://github.com/huridocs/uwazi/wiki/Install-Uwazi-on-your-server).
