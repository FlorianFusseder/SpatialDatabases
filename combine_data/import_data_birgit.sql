/** Import Data from Birgit **/

/** Parks **/
create table park_ratings
(
gid int,
park_area double precision,
rating double precision
);

COPY park_ratings FROM '/Users/florianfritz/Desktop/data/parks/neighbourhood_parks_table2.txt' DELIMITER ';' CSV HEADER;
SELECT * FROM park_ratings;

/** Playgrounds **/
create table playground_ratings
(
gid int,
playground_count int,
area double precision,
rating double precision
);

COPY playground_ratings FROM '/Users/florianfritz/Desktop/data/playgrounds/neighbourhood_playground_table2.txt' DELIMITER ';' CSV HEADER;
SELECT * FROM playground_ratings;

/** Resturants **/
create table restaurant_rating
(
gid int,
restaurant_count int,
rating double precision
);

COPY restaurant_rating FROM '/Users/florianfritz/Desktop/data/restaurants/restaurants_table2.txt' DELIMITER ';' CSV HEADER;
SELECT * FROM restaurant_rating;

/** Soccerfields **/
create table soccerfields_rating
(
gid int,
distance double precision,
rating double precision
);

COPY soccerfields_rating FROM '/Users/florianfritz/Desktop/data/soccerfields/soccerfield_data.txt' DELIMITER ';' CSV HEADER;
SELECT * FROM soccerfields_rating;

/** Subway **/
create table subway_rating
(
gid int,
distance double precision,
rating double precision
);

COPY subway_rating FROM '/Users/florianfritz/Desktop/data/subway/subwaydistance_table.txt' DELIMITER ';' CSV HEADER;
SELECT * FROM subway_rating;