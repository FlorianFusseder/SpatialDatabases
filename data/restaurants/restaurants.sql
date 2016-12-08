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
(select camis as rid, name, zipcode, street, cuisine from restaurantstemp group by (rid, name, zipcode, street, cuisine));


--#################################### create a table restaurants where all restaurants are listed with their geometry ; therefore the two tables rests and addresses are joined using the address to get the geometry data for the restaurants

drop table restaurants;
create table restaurants as
(select rid, name, r.zipcode as zipcode, r.street as street, cuisine, geom
from rests r left join uniadresses a on (r.street=a.streets and r.zipcode=a.zips));

-- some restaurants have the same address
-- some entries get duplicated, why?? -> more entries in address relation
-- some restaurants are not matched to a geometry -> street name is saved in different ways in the two relations (e.g. 10 AVENUE and 10TH AVE) --> only zipcode are now considered 
-- -> matching zip code to neighbourhood

create table nzip as
(select n.name, n.gid, n.geom, a.zipcode
	from neighbourhood n, addresses a
	where st_intersects(n.geom, a.geom)
	group by(n.name, n.gid, n.geom, a.zipcode));
	
-- -> problem: zipcodes are not matchable to neighbourhoods, one neighbourhhood has more zipcodes and one zipcode can belong to more than one neighbourhood
-- -> now the previously created table restaurants is used for further processing unless a better solution can be found -> so only restaurants with valid address are considered for now on
-- this might not really be a problem as only the number of restaurants in a neighbourhood is used for the comparison and it is assumed that the restaurants with invalid address are distributed somewhat equally (11 of 26 invalid)
-- for faster processing all data with invalid geometry is deleted 
delete from restaurants where geom is null; 

-- now only a table containing the information about the restaurants in the neighbourhood is needed.
drop table neighbourhood_restaurants;
create table neighbourhood_restaurants as
(
	select n1.gid, coalesce(r.restaurants, 0) as restaurants
	from neighbourhood n1 left outer join
		(select n.gid, count(*) as restaurants
		from neighbourhood n, restaurants r
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

