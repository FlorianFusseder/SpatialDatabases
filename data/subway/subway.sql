-- create table subwaystation with all relevant information needed
drop table subwaystations;
create table subwaystation as
(select gid, geom from subwaystations);

-- creates a table which shows the neighbourhood and its distance to the next subwaystation
create table subwaydistance as
(select distinct on(n.gid) n.gid as gid, st_distance(st_makeValid(n.geom)::GEOGRAPHY, st_makeValid(s.geom)::GEOGRAPHY) as distance
		from neighbourhood n, subwaystation s
		order by n.gid, distance);	

select * from subwaydistance;
-- the rating rates from 1 (subway in the area) to 0 (very far from subway)		

alter table subwaydistance add column rating float;

update subwaydistance set
rating = ((distance::FLOAT) / (select max(distance) from subwaydistance)::FLOAT -1.0 )*(-1.0);

-- only very few neighbourhoods have low values