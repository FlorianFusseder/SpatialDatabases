-- create the tables with all relevant data from the imported shapefile source
-- maybe the table can be added together with the soccer one

create table playground as
(select gid, geom from playgrounds);

create table soccerfield as
(select gid, geom from soccerfields);

-- this table shows how many playground there are in a neighbourhood area


drop table neighbourhood_playground;
create table neighbourhood_playground as
(
	select n.gid, count(p.geom) as playgrounds
	from neighbourhood n left outer join
		playground p
		on(st_intersects(n.geom, p.geom))
	group by n.gid
);

alter table neighbourhood_playground add column rating float;		
update neighbourhood_playground set
rating = playgrounds::FLOAT / (select max(playgrounds) from neighbourhood_playground)::FLOAT;

-- rating not ideal; generally very low rating values; maybe consideration of area or popultion in the neighbourhood