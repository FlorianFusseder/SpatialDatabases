/* public schoolpoints */
/*_________________________________________________________________________________________________________*/

SELECT * FROM public_school_points;

/* public school data per region*/
CREATE TABLE public_school_points_per_region AS
 SELECT a.ntacode, COUNT(sp.geom) AS Total
 FROM areas a
 LEFT JOIN public_school_points sp
 ON ST_CONTAINS(a.geom, sp.geom)
 GROUP BY a.ntacode;

/* View for public school areas*/
CREATE VIEW publicschoolarea AS
 SELECT a.ntacode, (COUNT(sp.geom)::FLOAT / (SELECT MAX(total)::FLOAT FROM public_school_points_per_region) ) AS Total
 FROM areas a
 LEFT JOIN public_school_points sp
 ON ST_CONTAINS(a.geom, sp.geom)
 GROUP BY a.ntacode;