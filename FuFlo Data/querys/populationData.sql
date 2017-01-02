/* Population Data */
/*_________________________________________________________________________________________________________*/

CREATE TABLE population_data
(
    borough	VARCHAR,
    countycode INTEGER,
    ntacode VARCHAR,
    ntaname VARCHAR,
    Population INTEGER
);

COPY population_data FROM 'D:\Spatial\Data\CSV\Population_Data\Population_Data.txt' DELIMITER '	' CSV;

SELECT * FROM population_data;

/* View for Rental Data*/
CREATE VIEW populationarea AS
(SELECT a.ntacode, ((p.population::FLOAT / ST_AREA(a.geom::geography)::FLOAT) / (pmax.maximum::FLOAT / ST_AREA(a.geom::geography)::FLOAT)) AS populationfactor
 FROM areas a, population_data p, (SELECT max(pp.population) AS maximum FROM population_data pp) AS pmax
 WHERE a.ntacode=p.ntacode);