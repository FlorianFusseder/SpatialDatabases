﻿/** Create the views for Florian Fusseders data **/
/** All view commands are from Florians files **/

/** collegues and universities **/
CREATE VIEW colleguesuniversityarea AS
(SELECT a.ntacode, (COUNT(cu.geom)::FLOAT / (SELECT MAX(total)::FLOAT from colleguesuniversity_per_region)) AS Total
 FROM areas a
 LEFT JOIN colleges_and_universitys cu
 ON ST_CONTAINS(a.geom, cu.geom)
 GROUP BY a.ntacode);   

SELECT * FROM colleguesuniversityarea; 

/** Parking Lot **/
CREATE VIEW parkinglotarea AS
 SELECT a.ntacode, (SUM(ST_AREA(pl.geom::geography))::FLOAT / (SELECT MAX(total)::FLOAT FROM parking_lots_per_region)) AS Total
 FROM areas a
 LEFT JOIN parking_lots pl
 ON ST_INTERSECTS(a.geom, pl.geom)
 GROUP BY a.gid, a.ntacode, a.boro_name, a.shape_leng, a.county_fip;

SELECT * FROM parkinglotarea;

/** Public Schools **/
CREATE VIEW publicschoolarea AS
 SELECT a.ntacode, (COUNT(sp.geom)::FLOAT / (SELECT MAX(total)::FLOAT FROM public_school_points_per_region) ) AS Total
 FROM areas a
 LEFT JOIN public_school_points sp
 ON ST_CONTAINS(a.geom, sp.geom)
 GROUP BY a.ntacode;

SELECT * FROM publicschoolarea;

/** Retal **/
CREATE VIEW rentalarea AS
 SELECT a.ntacode, ((SUM(r.value_per_sqft)::FLOAT / COUNT(r.value_per_sqft))::FLOAT / (SELECT MAX(total) FROM rental_data_per_region)) AS Total
 FROM areas a
 LEFT JOIN allrentaldata r
 ON ST_CONTAINS(a.geom, r.coords)
 GROUP BY a.ntacode;

SELECT * FROM rentalarea;

/** Population **/
CREATE VIEW populationarea AS
(SELECT a.ntacode, (p.population::FLOAT / pmax.maximum::FLOAT ) AS populationfactor
 FROM areas a, population_data p, (SELECT max(pp.population) AS maximum FROM population_data pp) AS pmax
 WHERE a.ntacode=p.ntacode);

SELECT * FROM populationarea;

/** Complaint **/
CREATE VIEW complaintarea AS
(SELECT a.ntacode, (COUNT(cd.complaintnr)::FLOAT / (SELECT MAX(total)::FLOAT FROM complaint_data_per_region)) AS Total
 FROM areas a
 LEFT JOIN complaint_data cd
 ON ST_CONTAINS(a.geom, cd.coords)
 GROUP BY a.ntacode);

SELECT * FROM complaintarea;
