/* Rental Data Mapbox */
/*_________________________________________________________________________________________________________*/

CREATE TABLE rental_data_manhatten_mapbox_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    long DECIMAL,
    lat DECIMAL
);

CREATE TABLE rental_data_Bronx_mapbox_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    long DECIMAL,
    lat DECIMAL
);

CREATE TABLE rental_data_Brooklyn_mapbox_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    long DECIMAL,
    lat DECIMAL
);

CREATE TABLE rental_data_Queens_mapbox_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    long DECIMAL,
    lat DECIMAL
);

CREATE TABLE rental_data_StatenIsland_mapbox_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    long DECIMAL,
    lat DECIMAL
);

COPY rental_data_manhatten_mapbox_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_mapbox\b1_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_bronx_mapbox_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_mapbox\b2_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_brooklyn_mapbox_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_mapbox\b3_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_queens_mapbox_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_mapbox\b4_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_statenisland_mapbox_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_mapbox\b5_reworked.txt' DELIMITER '	' CSV;


CREATE TABLE rental_data_manhatten_mapbox AS
(SELECT man.address, man.neighborhood, man.value_per_sqft, man.long, man.lat, ST_MakePoint(man.long, man.lat) as coords 
 FROM rental_data_manhatten_mapbox_temp man);
 
 CREATE TABLE rental_data_bronx_mapbox AS
(SELECT bro.address, bro.neighborhood, bro.value_per_sqft, bro.long, bro.lat, ST_MakePoint(bro.long, bro.lat) as coords 
 FROM rental_data_bronx_mapbox_temp bro);
 
 CREATE TABLE rental_data_brooklyn_mapbox AS
(SELECT bro.address, bro.neighborhood, bro.value_per_sqft, bro.long, bro.lat, ST_MakePoint(bro.long, bro.lat) as coords 
 FROM rental_data_brooklyn_mapbox_temp bro);
 
 CREATE TABLE rental_data_queens_mapbox AS
(SELECT que.address, que.neighborhood, que.value_per_sqft, que.long, que.lat, ST_MakePoint(que.long, que.lat) as coords 
 FROM rental_data_queens_mapbox_temp que);
 
 CREATE TABLE rental_data_statenisland_mapbox AS
(SELECT sti.address, sti.neighborhood, sti.value_per_sqft, sti.long, sti.lat, ST_MakePoint(sti.long, sti.lat) as coords 
 FROM rental_data_statenisland_mapbox_temp sti);
 
 
 /* Find Failures Mapbox */

CREATE TABLE mapbox_fails AS
(
    SELECT *
	FROM rental_data_bronx_mapbox bron
	WHERE bron.lat > 41 or bron.lat < 40.5 OR
	bron.long < -74.25 or bron.long > -73.65
);

INSERT INTO mapbox_fails
(
    SELECT *
	FROM rental_data_brooklyn_mapbox broo
	WHERE broo.lat > 41 or broo.lat < 40.5 OR
	broo.long < -74.25 or broo.long > -73.65
);

INSERT INTO mapbox_fails
(
    SELECT *
	FROM rental_data_manhatten_mapbox manh
	WHERE manh.lat > 41 or manh.lat < 40.5 OR
	manh.long < -74.25 or manh.long > -73.65
);

INSERT INTO mapbox_fails
(
    SELECT *
	FROM rental_data_queens_mapbox manh
	WHERE manh.lat > 41 or manh.lat < 40.5 OR
	manh.long < -74.25 or manh.long > -73.65
);

INSERT INTO mapbox_fails
(
    SELECT *
	FROM rental_data_statenisland_mapbox manh
	WHERE manh.lat > 41 or manh.lat < 40.5 OR
	manh.long < -74.25 or manh.long > -73.65
);

SELECT count(*) FROM mapbox_fails;	/* Amount of Fails -> 2441, so we don't use mapbox data */

/* Rental Data Google */
/*_________________________________________________________________________________________________________*/

CREATE TABLE rental_data_manhatten_google_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    lat DECIMAL,
    long DECIMAL
);

CREATE TABLE rental_data_Bronx_google_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    lat DECIMAL,
    long DECIMAL
);

CREATE TABLE rental_data_Brooklyn_google_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    lat DECIMAL,
    long DECIMAL
);

CREATE TABLE rental_data_Queens_google_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    lat DECIMAL,
    long DECIMAL
);

CREATE TABLE rental_data_StatenIsland_google_temp
(
    Address VARCHAR,
    Neighborhood VARCHAR,
    Value_per_SqFt DECIMAL,
    lat DECIMAL,
    long DECIMAL
);

COPY rental_data_manhatten_google_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_google\b1_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_bronx_google_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_google\b2_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_brooklyn_google_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_google\b3_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_queens_google_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_google\b4_reworked.txt' DELIMITER '	' CSV;
COPY rental_data_statenisland_google_temp FROM 'D:\Spatial\Data\CSV\Rental_Data\CSV\reworked_google\b5_reworked.txt' DELIMITER '	' CSV;


CREATE TABLE rental_data_manhatten_google AS
(SELECT man.address, man.neighborhood, man.value_per_sqft, man.long, man.lat, ST_MakePoint(man.long, man.lat) as coords 
 FROM rental_data_manhatten_google_temp man);
 
 CREATE TABLE rental_data_bronx_google AS
(SELECT bro.address, bro.neighborhood, bro.value_per_sqft, bro.long, bro.lat, ST_MakePoint(bro.long, bro.lat) as coords 
 FROM rental_data_bronx_google_temp bro);
 
 CREATE TABLE rental_data_brooklyn_google AS
(SELECT bro.address, bro.neighborhood, bro.value_per_sqft, bro.long, bro.lat, ST_MakePoint(bro.long, bro.lat) as coords 
 FROM rental_data_brooklyn_google_temp bro);
 
 CREATE TABLE rental_data_queens_google AS
(SELECT que.address, que.neighborhood, que.value_per_sqft, que.long, que.lat, ST_MakePoint(que.long, que.lat) as coords 
 FROM rental_data_queens_google_temp que);
 
 CREATE TABLE rental_data_statenisland_google AS
(SELECT sti.address, sti.neighborhood, sti.value_per_sqft, sti.long, sti.lat, ST_MakePoint(sti.long, sti.lat) as coords 
 FROM rental_data_statenisland_google_temp sti);


/* Find Failures Google */

CREATE TABLE google_fails AS
(
    SELECT *
	FROM rental_data_bronx_google bron
	WHERE bron.lat > 41 or bron.lat < 40.5 OR
	bron.long < -74.25 or bron.long > -73.65
);

INSERT INTO google_fails
(
    SELECT *
	FROM rental_data_brooklyn_google broo
	WHERE broo.lat > 41 or broo.lat < 40.5 OR
	broo.long < -74.25 or broo.long > -73.65
);

INSERT INTO google_fails
(
    SELECT *
	FROM rental_data_manhatten_google manh
	WHERE manh.lat > 41 or manh.lat < 40.5 OR
	manh.long < -74.25 or manh.long > -73.65
);

INSERT INTO google_fails
(
    SELECT *
	FROM rental_data_queens_google manh
	WHERE manh.lat > 41 or manh.lat < 40.5 OR
	manh.long < -74.25 or manh.long > -73.65
);

INSERT INTO google_fails
(
    SELECT *
	FROM rental_data_statenisland_google manh
	WHERE manh.lat > 41 or manh.lat < 40.5 OR
	manh.long < -74.25 or manh.long > -73.65
);


select * from google_fails;	/* 4 Fails shown so we use google data... ofc...*/

/* table of all retal data */
CREATE TABLE allrentalData AS
SELECT * FROM rental_data_bronx_google;

INSERT INTO allrentaldata
SELECT * FROM rental_data_brooklyn_google;

INSERT INTO allrentaldata
SELECT * FROM rental_data_manhatten_google;

INSERT INTO allrentaldata
SELECT * FROM rental_data_queens_google;

INSERT INTO allrentaldata
SELECT * FROM rental_data_statenisland_google;

/* Rental Data per region table */
CREATE TABLE rental_data_per_region AS
 SELECT a.ntacode, (SUM(r.value_per_sqft)::FLOAT / COUNT(r.value_per_sqft)::FLOAT) AS Total
 FROM areas a
 LEFT JOIN allrentaldata r
 ON ST_CONTAINS(a.geom, r.coords)
 GROUP BY a.ntacode; 

/* Rental Data View*/
CREATE VIEW rentalarea AS
 SELECT a.ntacode, ((SUM(r.value_per_sqft)::FLOAT / COUNT(r.value_per_sqft))::FLOAT / (SELECT MAX(total) FROM rental_data_per_region)) AS Total
 FROM areas a
 LEFT JOIN allrentaldata r
 ON ST_CONTAINS(a.geom, r.coords)
 GROUP BY a.ntacode;

select * from rentalarea;