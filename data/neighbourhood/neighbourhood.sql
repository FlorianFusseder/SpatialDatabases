-- neighbourhoods table 
-- imported as shapefile from  source

drop table neighbourhood;
create table neighbourhood as
(select gid, ntacode as code, ntaname as name, geom from neighbourhoods);

-- 195 different neighbourhood areas
