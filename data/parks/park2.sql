-- parks -- create a table from the imported source with only the relevant information for further processing
create table park as
(select gid, zipcode, typecatego as type, geom from parks);
select * from park;

-- consider not only the parks in the neighbourhood but also the adjacent parks
-- -> takes to long to process -> for now only the parks within the area are considered

/*create table neighbourhood_parks_view as
(select nh.gid as gid, coalesce(a.area, 0) as parkarea  
from neighbourhood nh left outer join
	(select ((sum(st_area(st_intersection(st_makeValid(p.geom), st_makeValid(n.geom))::GEOGRAPHY)))/st_area(st_makeValid(n.geom)::GEOGRAPHY))*10  as area, n.gid as gid
	from park p, neighbourhood n
	where st_intersects(st_makeValid(p.geom), st_makeValid(n.geom))
	group by n.gid, n.geom
	order by area) a 
	on ( a.gid = nh.gid))
;*/ --> to slow creation of that table

-- for faster processing a temporal help table is created
drop table nhp_temp;
create table nhp_temp as 
( 
	select n.gid, (sum(st_area(st_intersection(st_makeValid(p.geom), st_makeValid(n.geom))::GEOGRAPHY))) as area, n.geom
	from park p, neighbourhood n
	where st_intersects(st_makeValid(p.geom), st_makeValid(n.geom)) 
	group by n.gid, n.geom
	);

alter table nhp_temp add column areaprop double precision;

update nhp_temp set
	areaprop = (area / st_area(st_makeValid(geom)::GEOGRAPHY)) ;
-- the nhp_temp raleation contains every neighbourhood with a park and its total area of parks
drop table neighbourhood_parks;
create table neighbourhood_parks as
(
	select n.gid, coalesce(t.areaprop, 0) as parkarea, n.geom
	from neighbourhood n
		left outer join
		nhp_temp t
		on(n.gid = t.gid)
		);


-- buffer the neighbourhoods for finding near parks in the buffer zone
alter table neighbourhood_parks add column buffer geometry;

update neighbourhood_parks set
buffer = st_buffer(geom::GEOGRAPHY, 500)::GEOMETRY;

-- this column is the buffer only without the neighbourhood area within
alter table neighbourhood_parks add column bufferonly geometry;

update neighbourhood_parks set
bufferonly = st_difference(buffer, st_setsrid(geom, 4326));

-- create a column with all parks adjacent to the neighbourhood (contains the total area of adjacent parks) --> seems to be correct
alter table neighbourhood_parks add column adjacent_parks double precision;

update neighbourhood_parks set
adjacent_parks = (select coalesce(sum(st_area(p.geom::GEOGRAPHY)), 0) from park p where st_intersects(p.geom, st_setsrid(bufferonly, 0)) group by neighbourhood_parks.gid);

-- create a new column for the parks next to the neighbourhood and their area compared to the total neighbourhood area
alter table neighbourhood_parks add column outer_parkarea double precision;
update neighbourhood_parks set
outer_parkarea = adjacent_parks/st_area(geom::GEOGRAPHY);

-- create a column for the total area of parks in and around the neighbourhood --> maybe for the rating inner and outer parkarea could be considered with a different factor
-- the total parks are the area of all parks counting to a certain  neighbourhood and divided through the total area of a neighbourhood
alter table neighbourhood_parks add column total_park double precision;
update neighbourhood_parks set
total_park = outer_parkarea + parkarea;


-- now add the rating for each neighbourhood area
alter table neighbourhood_parks	add column rating FLOAT;
update neighbourhood_parks set
rating = (total_park::FLOAT / (select max(total_park) from neighbourhood_parks)::FLOAT);	

-- the rating is generally very low except a few areas  -> maybe a different rating funtion
-- also the adjacent parks may count less for the rating than the parks inside a neighbourhood

select gid, total_park, rating from neighbourhood_parks order by rating desc;	

