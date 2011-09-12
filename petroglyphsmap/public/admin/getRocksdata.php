<?php

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // Aucune limite d'execution
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres"); // Base géographique du Bego

/*
* Postgres query
*/

$query = 'SELECT point_x, point_y, point_z, year
FROM rock
WHERE rock_id='.$_GET['rockid'];

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>