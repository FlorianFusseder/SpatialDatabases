/** General Data Import **/
DROP TABLE areas CASCADE;
SELECT * FROM areas;

/** Remove not important areas (parks, ...) **/
DELETE FROM areas
WHERE ntaname like '%-etc-%' or ntaname like '%Airport%';

/** Create an individual ratings/valuation view for one porperty */

/** Example Property: percentage of total area **/
CREATE VIEW area_size_rating AS
SELECT a.gid, 100 * ST_AREA(a.geom::geography)/b.total_area as rating
FROM areas as a,
	(SELECT SUM(ST_AREA(geom::geography)) as total_area FROM areas) as b;

SELECT * FROM area_size_rating;

/** Example Property: relative distance to center (air distance)**/
/** Get Center **/
CREATE VIEW city_center AS
SELECT ST_Centroid(ST_Polygonize(geom)) as center
FROM areas;
/** Use it to get distances to the center **/
CREATE VIEW city_center_distances AS
SELECT a.gid as gid, ST_Distance(ST_Centroid(a.geom)::geography, c.center::geography) as distance
FROM areas as a, city_center as c;
/** Normalise the data to values between 0 and 1 **/
CREATE VIEW area_center_distance_rating AS
SELECT c1.gid as gid, c1.distance / c2.max_distance as rating
FROM city_center_distances as c1,
	(SELECT MAX(distance) as max_distance FROM city_center_distances) as c2;

SELECT * FROM area_center_distance_rating;

/** Combine all ratings/valuations into on big view **/
DROP VIEW area_ratings;
DROP TABLE area_ratings;

/** CREATE TABLE area_ratings AS **/
/** Creating a table would esentially be a cache. You can decide at what layer to implement the cache **/
CREATE VIEW area_ratings AS
SELECT a.gid as gid, a.geom as geom, a.ntaname as ntaname, a.boro_name as boro_name,
	size_rating.rating as size_rating, center_rating.rating as center_rating
FROM areas as a, area_size_rating AS size_rating, area_center_distance_rating as center_rating
WHERE a.gid = size_rating.gid and a.gid = center_rating.gid;

/** This compound view will be served by the GeoServer **/
/** Otuputs will be cached, as this view has a lot selects in it **/
/** We focus on clear queries vs. performance, as the data does not change often **/
SELECT * FROM area_ratings;
