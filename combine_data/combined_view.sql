/** Combined View **/

/** CREATE View area_ratings AS **/
CREATE TABLE area_ratings AS
SELECT a.gid as gid, a.geom as geom, ST_Centroid(a.geom) as center, a.ntaname as ntaname, a.boro_name as boro_name,
  size_rating.rating as size_rating, center_rating.rating as center_rating,
  university_rating.total as university_rating, parking_rating.total as parking_rating,
  school_rating.total as school_rating, rental_rating.total as rental_rating,
  population_rating.populationfactor as population_rating,
  complaint_rating.total as complaint_rating, park_ratings.rating as park_ratings,
  playground_ratings.rating as playground_ratings, restaurant_rating.rating as restaurant_rating,
  soccerfields_rating.rating as soccerfields_rating, subway_rating.rating as subway_rating
FROM areas as a
LEFT JOIN area_size_rating AS size_rating
ON a.gid = size_rating.gid 
LEFT JOIN area_center_distance_rating as center_rating
ON a.gid = center_rating.gid
LEFT JOIN colleguesuniversityarea as university_rating
ON a.ntacode = university_rating.ntacode
LEFT JOIN parkinglotarea as parking_rating
ON a.ntacode = parking_rating.ntacode
LEFT JOIN publicschoolarea as school_rating
ON a.ntacode = school_rating.ntacode
LEFT JOIN rentalarea as rental_rating
ON a.ntacode = rental_rating.ntacode
LEFT JOIN populationarea as population_rating
on a.ntacode = population_rating.ntacode
LEFT JOIN complaintarea as complaint_rating
on a.ntacode = complaint_rating.ntacode
LEFT JOIN park_ratings as park_ratings
on a.gid = park_ratings.gid
LEFT JOIN playground_ratings as playground_ratings
on a.gid = playground_ratings.gid
LEFT JOIN restaurant_rating as restaurant_rating
on a.gid = restaurant_rating.gid
LEFT JOIN soccerfields_rating as soccerfields_rating
on a.gid = soccerfields_rating.gid
LEFT JOIN subway_rating as subway_rating
on a.gid = subway_rating.gid;
DROP TABLE area_ratings;

/** This compound view will be served by the GeoServer **/
/** Otuputs will be cached, as this view has a lot selects in it **/
/** We focus on clear queries vs. performance, as the data does not change often **/
SELECT * FROM area_ratings;