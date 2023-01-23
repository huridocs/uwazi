This example shows a basic approach at deploying a working Uwazi.

## First one-time setup

Ensure you have all [Uwazi dependencies](https://github.com/huridocs/uwazi#dependencies) correctly configured an running.

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

- From within the `uwazi` folder, download the latest release .tar file:

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

## Update Uwazi to a new release

- Rename or delete previous `latest` folder
- From within `uwazi` folder, download the latest release .tar file, unpack, rename to `latest` and remove the previou .tar file.

```
wget https://github.com/huridocs/uwazi/releases/latest/download/uwazi.tgz
tar xvf uwazi.tgz
mv prod latest && rm uwazi.tgz
```

- From within `uwazi/latest` run any migrations needed since your previous version and reindex the Elastic Search index:

`NODE_ENV=production DATABASE_NAME=my_db_name INDEX_NAME=my_db_name yarn migrate-and-reindex`

## Run Uwazi

You should now be able to run an Uwazi instance in production mode:

`DATABASE_NAME=my_db_name INDEX_NAME=my_db_name NODE_ENV=production FILES_ROOT_PATH=/home/user/uwazi/ node server.js`

By default, Uwazi runs on `localhost` on port 3000, so point your browser to http://localhost:3000 and authenticate yourself with the default username "admin" and password "change this password now".
It is advisable to create your own system service configuration. Check out the user guide for [more configuration options](https://github.com/huridocs/uwazi/wiki/Install-Uwazi-on-your-server).

## How to upgrade from a previous install.sh installation
Previous installation with install.sh created uploaded files folders inside the uwazi build folder, to migrate and use the release that we publish just follow the [First one-time setup](#first-one-time-setup) but instead of creating the folders, move them from the previous installation path
```
mv old_uwazi_path/uwazi-production/uploaded_files /home/user/uwazi
mv old_uwazi_path/uwazi-production/custom_uploads /home/user/uwazi
mv old_uwazi_path/uwazi-production/temporal_files /home/user/uwazi
mv old_uwazi_path/uwazi-production/log /home/user/uwazi
```

After this, [Update to the next release](#update-uwazi-to-a-new-release), keep in mind that probably you were using the default database name and elastic index `uwazi_development` if that is the case and you want to keep using it you will need omit DATABASE_NAME and INDEX_NAME from all the commands you run

