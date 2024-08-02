This example shows a basic approach at deploying a working Uwazi.

## First one-time setup

Ensure that all [Uwazi dependencies](https://github.com/huridocs/uwazi#dependencies) are installed, correctly configured an running.

During the first time installation, create a basic folder structure with folders for potential uploaded files, files created by Uwazi and the production-build code for Uwazi.
To create this folder structure run:

```
mkdir -p uwazi/log uwazi/uploaded_documents uwazi/custom_uploads uwazi/temporal_files
.
├── /xxxx/yyyy/uwazi
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
- From within `uwazi` folder, download the latest release .tar file, unpack, rename to `latest` and remove the previous .tar file.

```
wget https://github.com/huridocs/uwazi/releases/latest/download/uwazi.tgz
tar xvf uwazi.tgz
mv prod latest && rm uwazi.tgz
```

- From within `uwazi/latest` run any migrations needed since your previous version and reindex the Elastic Search index:

`NODE_ENV=production DATABASE_NAME=my_db_name INDEX_NAME=my_db_name FILES_ROOT_PATH=/xxxx/yyyy/uwazi/ yarn migrate-and-reindex`

## Run Uwazi

You should now be able to run an Uwazi instance in production mode:

`DATABASE_NAME=my_db_name INDEX_NAME=my_db_name NODE_ENV=production FILES_ROOT_PATH=/xxxx/yyyy/uwazi/ node server.js --no-experimental-fetch`

By default, Uwazi runs on `localhost` port 3000, so point your browser to http://localhost:3000 and authenticate yourself with the default username "admin" and password "change this password now".

It is advisable to create your own system service configuration. Check out the user guide for [more configuration options](https://github.com/huridocs/uwazi/wiki/Install-Uwazi-on-your-server).

## How to upgrade from a previous install.sh installation

_Note_ This is only required if you have a previous installation made with the now deprecated `install.sh` script.

Previous installations with `install.sh` created the `uploaded_documents` and other folders inside the build folder, which made updating the package a complex process. The current folder structure is more friendly for upgrading processes. In order to migrate to the new structure and use the release that we publish just move the file folders from the previous installation path:

```
mv old_uwazi_path/uwazi-production/uploaded_documents /xxxx/yyyy/uwazi
mv old_uwazi_path/uwazi-production/custom_uploads /xxxx/yyyy/uwazi
mv old_uwazi_path/uwazi-production/temporal_files /xxxx/yyyy/uwazi
mv old_uwazi_path/uwazi-production/log /xxxx/yyyy/uwazi
```

After this, [Update to the next release](#update-uwazi-to-a-new-release). Keep in mind that, probably, your system was configured with the default database name and elastic index `uwazi_development`. If that is the case, you can omit DATABASE_NAME and INDEX_NAME from all the commands you run, it will default to `uwzai_development` as expected.
