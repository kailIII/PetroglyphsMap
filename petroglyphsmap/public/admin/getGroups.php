<?php

include '../config.php';

/*
* Postgres query
*/

$query = 'SELECT group_number, group_id
FROM "group"
WHERE zone_id='.$_GET['zoneid'].'
ORDER BY group_number ASC';

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>