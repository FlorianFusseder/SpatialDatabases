# Frontend

To view the project you will have to have a correctly configured GeoServer as a data source.
You will also need to run a local web server to serve the page.


All required setup steps are presented in the following sections.


If you do not want to Take all these steps you can run a simple, static version of the app.
To do so skip over the following sections and go directly to 'Quick Setup'.

## Setup Database

TODO: Database Setup

## Setup GeoServer

TODO: GeoServer Setup

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
