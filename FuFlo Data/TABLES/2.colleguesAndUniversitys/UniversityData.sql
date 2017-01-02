/* Collegues and universitys */
/*_________________________________________________________________________________________________________*/

SELECT * FROM colleges_and_universitys;

/* Collegues and universtiys per region*/
 CREATE TABLE colleguesuniversity_per_region AS
(SELECT a.ntacode, (COUNT(cu.geom)) AS Total
 FROM areas a
 LEFT JOIN colleges_and_universitys cu
 ON ST_CONTAINS(a.geom, cu.geom)
 GROUP BY a.ntacode);
 
/* Collegue View */
CREATE VIEW colleguesuniversityareabuffer AS
(SELECT a.ntacode, (COUNT(cu.geom)::FLOAT / (SELECT MAX(total)::FLOAT from colleguesuniversity_per_region)) AS Total
 FROM areas a
 LEFT JOIN colleges_and_universitys cu
 ON ST_DWITHIN(a.geom::geography, cu.geom, 200)
 GROUP BY a.ntacode);