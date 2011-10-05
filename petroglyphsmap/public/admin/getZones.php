<?php

include '../config.php';

/*
* Postgres query
*/

$query = 'SELECT zone_number, zone_id
FROM zone
ORDER BY zone_number ASC';

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>