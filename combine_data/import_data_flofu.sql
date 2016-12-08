/** Import Data From Florian Fusseder **/
/** Each table is imported with one psql command **/

/** psql spt-project < colleguesanduniversitys **/
SELECT * FROM colleges_and_universitys;

/**  psql spt-project < colleguesanduniversitys_per_regions **/
SELECT * FROM colleguesuniversity_per_region;

/** psql spt-project < parkinglots **/
SELECT * FROM parking_lots;

/** psql spt-project < parkinglots_per_region **/
SELECT * FROM parking_lots_per_region;

/** psql spt-project < schoolspoints **/
SELECT * FROM public_school_points;

/** psql spt-project < schoolpoints_per_region **/
SELECT * FROM public_school_points_per_region;

/** psql spt-project < allrentaldata **/
SELECT * FROM allrentaldata;

/** psql spt-project < rentaldata_per_region **/
SELECT * FROM rental_data_per_region;

/**  psql spt-project < population **/
SELECT * FROM population_data;

/** psql spt-project < complaint **/
SELECT * FROM complaint_data;

/** psql spt-project < complaint_per_region **/
SELECT * FROM complaint_data_per_region;

/** Correct the reference systems **/
ALTER TABLE colleges_and_universitys
ALTER COLUMN geom TYPE geometry(Point, 4326) 
 USING ST_SetSRID(geom, 4326);

ALTER TABLE complaint_data
ALTER COLUMN coords TYPE geometry(Geometry, 4326) 
 USING ST_SetSRID(coords, 4326);

ALTER TABLE allrentaldata
ALTER COLUMN coords TYPE geometry(Geometry, 4326) 
 USING ST_SetSRID(coords, 4326);

ALTER TABLE public_school_points
ALTER COLUMN geom TYPE geometry(Point, 4326) 
 USING ST_SetSRID(geom, 4326);

ALTER TABLE parking_lots
ALTER COLUMN geom TYPE geometry(Multipolygon, 4326) 
 USING ST_SetSRID(geom, 4326);

/** Imports where successfull, now execute all the commands to create views **/