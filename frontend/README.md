# Frontend

To view the project you will have to have a correctly configured GeoServer as a data source.
You will also need to run a local web server to serve the page.


All required setup steps are presented in the following sections.


If you do not want to Take all these steps you can run a simple, static version of the app.
To do so skip over the following sections and go directly to 'Quick Setup'.

## Setup Database

To setup the database you will import an dump of our postgres database.
This will add all datasets that we have imported to your postgres database.

To import the data execute the following command with corrected paths.

`psql spt-project < path/to/backup`

spt-project is the name of the database that you want to import the data into.

The data is then composed in views to be presented in a consistent form to geoserver.
See the setup_data_views.sql file for the general structure of the data views and how
they are composed to the final view that is presented to geoserver.

## Setup GeoServer

Start with a default geo server installation and follew the next steps:
- Create Workspace
  - Create a new Workspace
  - Name: spt-project, URI: spt-project
- Connect to the database
  - Add Data Source
  - Select PostGIS
  - Select the spt-project Workspace
  - Name the source spt-project
  - Configure it to connect to spt-project database
- Create the layer
  - After connecting to the database you will see an view with the avaliable tabels/views
  - Publish the area_ratings view/table

## Setup WebServer

Browsers do not allow cross side scripting. To solve this we will run a proxy using node:
- Install NodeJS and npm
- Run `npm install local-web-server --global` to install a local development server
- Switch to the frontend directory
- Run `ws --rewrite '/geoserver/* -> http://localhost:8080/geoserver/$1'` to start the server
   (the second url points to our local geo server installation)


## Quick Setup

Use this section to quickly setup a static version of the app.
This version will use a staticly generated 'areas.geojson' file.

Open script.js and uncomment the follwing line in it:
`// dataSource = './areas.geojson';`
This will now load the local geojson instead of using the server version.

You will have to serve the frontend server using any web server of your choice.
If you are using Webstorm simply right click on the `index.html` file and select run.
