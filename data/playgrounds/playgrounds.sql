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
	select n.gid, count(p.geom) as playgrounds, n.geom 
	from neighbourhood n left outer join
		playground p
		on(st_intersects(n.geom, p.geom))
	group by (n.gid, n.geom)
);



-- this table contains the neighhourhood and the playgrounds in a distance within 500 m of the neighbourhood
create table adja_temp as
(select n.gid, count(p.geom) as playgrounds
from playground p, neighbourhood n 
where st_distance(p.geom::GEOGRAPHY, n.geom::GEOGRAPHY) < 500
group by n.gid);

-- now put the previously creatded table to the neighbourhoos playgrounds
alter table neighbourhood_playground drop column adjacent_playgrounds ;
alter table neighbourhood_playground add column adjacent_playgrounds bigint;
update neighbourhood_playground n set
adjacent_playgrounds = coalesce(((select playgrounds from adja_temp a where a.gid=n.gid) - playgrounds), 0);

-- now add a column which holds all the playgrounds together with a lesser factor for the adjacent -> 3 times
alter table neighbourhood_playground drop column playgrounds_total ;
alter table neighbourhood_playground add column playgrounds_total bigint;
update neighbourhood_playground n set
playgrounds_total = 3*playgrounds + adjacent_playgrounds;



-- now the area of the neighbourhood is also considered: just a value to determine the number of playgrounds in a neighbourhood depending on the area
alter table neighbourhood_playground drop column playgrounds_per_area;
alter table neighbourhood_playground add column playgrounds_per_area float;
update neighbourhood_playground set
playgrounds_per_area = ( playgrounds_total::FLOAT / st_area(geom)::FLOAT) ;


-- create the rating coumn
alter table neighbourhood_playground drop column rating;
alter table neighbourhood_playground add column rating float;		
update neighbourhood_playground set
rating = playgrounds_per_area::FLOAT / (select max(playgrounds_per_area) from neighbourhood_playground)::FLOAT;

select gid, playgrounds, playgrounds_per_area, rating from neighbourhood_playground order by rating desc;
