/* Complaint Data */
/*_________________________________________________________________________________________________________*/
CREATE TABLE complaint_data_temp
(
	Complaintnr INTEGER,
    Description VARCHAR,
    TypeOfComplaint VARCHAR,
    Latitude DOUBLE PRECISION,
    Longitude DOUBLE PRECISION
);

COPY complaint_data_temp FROM 'D:\Spatial\Data\CSV\Complaint_Data\Comlaint_Data.txt' DELIMITER '	' CSV;

SELECT * FROM complaint_data_temp;

CREATE TABLE complaint_data AS
(SELECT cdt.Complaintnr, cdt.Description, cdt.TypeOfComplaint, cdt.Latitude, cdt.Longitude, ST_MAKEPOINT(cdt.Longitude, cdt.Latitude) as coords
 FROM complaint_data_temp cdt);

/* Complaint data per region */
CREATE TABLE complaint_data_per_region AS
SELECT a.ntacode, COUNT(cd.complaintnr) AS Total
FROM areas a
LEFT JOIN complaint_data cd
ON ST_CONTAINS(a.geom, cd.coords)
GROUP BY a.ntacode
ORDER BY COUNT(cd.complaintnr) DESC;

/* View Vor Complaint data */
CREATE VIEW complaintarea AS
(SELECT a.ntacode, (COUNT(cd.complaintnr)::FLOAT / (SELECT MAX(total)::FLOAT FROM complaint_data_per_region)) AS Total
 FROM areas a
 LEFT JOIN complaint_data cd
 ON ST_CONTAINS(a.geom, cd.coords)
 GROUP BY a.ntacode);