This example shows a basic approach at deploying a working Uwazi.

## First one-time setup

Ensure you have all [Uwazi dependencies](https://github.com/huridocs/uwazi#dependencies) correctly congifured an running.

During the first time installation, create a basic folder structure with folders for potential uploaded files, files created by Uwazi and the production-build code for Uwazi.
To create this folder structure run:

```
mkdir -p uwazi/log uwazi/uploaded_documents uwazi/custom_uploads uwazi/temporal_files
.
├── /home/user/uwazi
│   ├── log/
│   ├── uploaded_documents/
│   ├── custom_uploads/
│   ├── temporal_files/
```

- From within the `uwazi` folder, download latest release tar:

`wget https://github.com/huridocs/uwazi/releases/latest/download/uwazi.tgz`

- Unpack the file. This will create a `prod` folder with the latest Uwazi production code:

`tar xvf uwazi.tgz`

- Rename to the `prod` folder to `lastest` and delete the .tar file:

`mv prod latest && rm uwazi.tgz`

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

- From within `uwazi/latest`, create a blank state with the desired database name. The platform deafults to `uwazi_development` if you don't define any name.

`NODE_ENV=production yarn blank-state my_db_name`

## Update uwazi to a new release

- Rename or delete previous latest folder
- From within `uwazi` folder download latest release tar, unpack, rename to `latest` and remove the previou .tar file.

```
wget https://github.com/huridocs/uwazi/releases/latest/download/uwazi.tgz
tar xvf uwazi.tgz
mv prod latest && rm uwazi.tgz
```

- From within `uwazi/latest` run any migrations needed since your previous version and reindex the Elastic Search index:

`NODE_ENV=production yarn migrate-and-reindex`

## Run uwazi

You should now be able to run an Uwazi instacne in production mode:

`DATABASE_NAME=my_db_name INDEX_NAME=my_db_name NODE_ENV=production FILES_ROOT_PATH=/home/user/uwazi/ node server.js`

By default, Uwazi runs on `localhost` on port 3000, so point your browser to http://localhost:3000 and authenticate yourself with the default username "admin" and password "change this password now".
It is advisable to create your own system service configuration. Check out the user guide for [more configuration options](https://github.com/huridocs/uwazi/wiki/Install-Uwazi-on-your-server).
