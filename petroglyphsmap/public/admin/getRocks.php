<?php

include '../config.php';

/*
* Postgres query
*/

$query = 'SELECT rock_number, rock_id
FROM rock
WHERE group_id='.$_GET['groupid'].'
ORDER BY rock_number ASC';

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>