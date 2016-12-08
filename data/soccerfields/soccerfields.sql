-- creation of the table containing all relevant date from the imported shapefile source

create table soccerfield as
(select gid, geom from soccerfields);

-- in this case as there are not that many soccer and football fields the distance from one neighbourhood area to the next soccerfield should be rated

create table neighbourhood_soccer_distance as
(select distinct on(n.gid) n.gid as gid, st_distance(st_makeValid(n.geom)::GEOGRAPHY, st_makeValid(s.geom)::GEOGRAPHY) as distance
		from neighbourhood n, soccerfield s
		order by n.gid, distance);	


-- now the rating wich rates from 1 (soccer field nearby in the area) to 0 (very far from subway)		

alter table neighbourhood_soccer_distance add column rating float;

update neighbourhood_soccer_distance set
rating = ((distance::FLOAT) / (select max(distance) from neighbourhood_soccer_distance)::FLOAT -1.0 )*(-1.0);		

select * from neighbourhood_soccer_distance;

-- rating not ideal; all values quite high except a very few very low ratings 
-- -> maybe different function?