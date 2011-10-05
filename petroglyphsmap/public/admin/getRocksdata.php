<?php

include '../config.php';

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