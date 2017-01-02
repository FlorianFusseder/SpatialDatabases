/* parkinglot  */
/*_________________________________________________________________________________________________________*/

SELECT * FROM parking_lots;

/* Parking lot area per region */
CREATE TABLE parking_lots_per_region AS
 SELECT a.ntacode, (SUM(ST_AREA(pl.geom::geography))::FLOAT / ST_AREA(a.geom::geography)) AS Total
 FROM areas a
 LEFT JOIN parking_lots pl
 ON ST_INTERSECTS(a.geom, pl.geom)
 GROUP BY a.ntacode, a.geom;
 
/* Parking lot view */ 
CREATE VIEW parkinglotarea AS
 SELECT a.ntacode, (pl.total::FLOAT / (SELECT MAX(total)::FLOAT FROM parking_lots_per_region)) AS Total
 FROM areas a
 LEFT JOIN parking_lots_per_region pl
 ON (a.ntacode = pl.ntacode);