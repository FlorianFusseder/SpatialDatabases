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
	select n.gid, coalesce(t.areaprop, 0) as parkarea
	from neighbourhood n
		left outer join
		nhp_temp t
		on(n.gid = t.gid)
		);

alter table neighbourhood_parks	add column rating FLOAT;
update neighbourhood_parks set
rating = (parkarea::FLOAT / (select max(parkarea) from neighbourhood_parks)::FLOAT);	

-- the rating is generally very low except a few areas  -> maybe a different rating funtion
-- also the adjacet areas with parks may be considered


	