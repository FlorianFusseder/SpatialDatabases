--########### import of restaurantstable
-- problem of that dataset is that there are no geometry attribute but only common addresses

 drop table restaurantsTemp;
 create table restaurantsTemp
(
	CAMIS int,
	name varchar,
	BORO varchar,
	BUILDING varchar,
	STREET varchar,
	ZIPCODE int,
	PHONE varchar,
	CUISINE varchar,
	INSPECTIONDATE varchar
	);

copy restaurantsTemp from 'D:\NYProject\rests2.txt' Delimiter ';' CSV;


--##### address table
-- create table addresses with all the information needed using the addresspoint data from datasource #########################
-- the table addresspoints was automatically imported as shapefile
select * from addresspoints where zipcode is null;

drop table addresses;
create table addresses as
(select gid, st_name as street, cast(zipcode as integer), geom  from addresspoints);

-- only addresses with a zip code and street can be used
delete from addresses where zipcode is null and street is null;

-- only the street and zipcode are considered in this example; 
-- therefore a certain street with zipcode can has several entries in the table as building numbers colunm is not considered as they is no matching part in the restaurants relation


-- create a new table with each address only once; this table contains only street and zipcode so far because of the grouping
create table uniadresses as
(	select street, zipcode from addresses group by (street, zipcode));


alter table uniadresses add column geom Geometry;
alter table uniadresses rename column zipcode to zips;
alter table uniadresses rename column street to streets;

-- now the table gets a geometry object by matching it with the other adress table and take the first geometry result
update uniadresses set geom = (select geom from addresses where zipcode=zips and street=streets limit 1);


--####################################### restaurants


-- create a table out of the imported data with only the neccessary attributes where all restaurants are listed only once 
drop table rests;
create table rests as
(select camis as rid, name, zipcode, street, cuisine from restaurantstemp group by (camis, name, zipcode, street, cuisine));

select count(*) from rests; -- 25956 restaurants

--#################################### create a table restaurants where all restaurants are listed with their geometry ; therefore the two tables rests and addresses are joined using the address to get the geometry data for the restaurants

drop table restaurants;
create table restaurants as
(select rid, name, r.zipcode as zipcode, r.street as street, cuisine, geom
from rests r left join uniadresses a on (r.street=a.streets and r.zipcode=a.zips));


-- some restaurants are not matched to a geometry -> street name is saved in different ways in the two relations (e.g. 10 AVENUE and 10TH AVE) 
--> using  geocoding programm to find the location of the not yet matched restaurants

select count(*) from restaurants where geom is null; --> 11817 restaurants do not have a geometry

-- now create a table which contains all the not matched restaurants for further processing
drop table rest_match;
create table rest_match as
(select * from restaurants where geom is null);

-- the empty geom data can now be deleteed from the restaurants table
delete from restaurants where geom is null;

-- ######################## us geocoding programm to get the addresses of the locations
-- create a sequence that the id's of the restaurants have a range from 1 to 11xxx -> easier for dividing the table for further processing
drop sequence seq;
create sequence seq start 1;

--alter table rest_match drop column id;
alter table rest_match add column id int;
update rest_match
set id=nextVal('seq');

-- divide data for better processing
select id, zipcode, street from rest_match where id > 7341 order by id;

-- in this table all the results from the geocoding programm are loaded
--drop table coded_data;
create table coded_data
(
	id int,
	latitude double precision,
	longitude double precision
	);

copy coded_data from 'D:\BA\database\data\restaurants\geoResults.txt' Delimiter ';' CSV;

-- now a geometry can be calculated from the longitude a latitude
alter table coded_data add column geom geometry;
update coded_data3 
set geom = st_makePoint(longitude, latitude);

select count(*) from coded_data;

select * from coded_data
union
select * from coded_data;


-- in this table all results of the geocoded locations are stored
drop table rest_coded;
create table rest_coded as
( select r.id, rid, name, zipcode, street, cuisine, c.geom
	from rest_match r 
		left outer join 
	(select * from coded_data union select * from coded_data2 union select * from coded_data3) c on (r.id = c.id)
);	

select id, zipcode, street from rest_coded where geom is null order by id;
select count(*) from rest_coded where geom is not null;

select * from rest_coded;
select * from restaurants;

-- now all objects matched with a geometry location are out into one table again
create table all_restaurants as
( select rid, geom, name from rest_coded where geom is not null
	union
  select rid, geom, name from restaurants
  );

  select count(*) from all_restaurants; -- 24933 -> only about 1000 addresses could not be matched with the geocoder

-- now only a table containing the information about the restaurants in the neighbourhood is needed.
drop table neighbourhood_restaurants;
create table neighbourhood_restaurants as
(
	select n1.gid, coalesce(r.restaurants, 0) as restaurants
	from neighbourhood n1 left outer join
		(select n.gid, count(*) as restaurants
		from neighbourhood n, all_restaurants r
		where st_intersects(n.geom, r.geom)
		group by (n.gid)) r 
	on(n1.gid = r.gid)
);

-- now there is only to add one more column which gives a rating about the restaurant number between 1 which is the best and 0
-- just very few good rated areas
alter table neighbourhood_restaurants drop column rating;
alter table neighbourhood_restaurants add column rating float;

update neighbourhood_restaurants set 
	rating = ((restaurants)::FLOAT / (select max(restaurants) from neighbourhood_restaurants r)::FLOAT);

select * from neighbourhood_restaurants order by rating desc;	

