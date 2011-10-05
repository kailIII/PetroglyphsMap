<?php

include '../config.php';

/*
* Postgres query
*/

$query = 'SELECT figure_number, figure_id
FROM figure
WHERE rock_id='.$_GET['rockid'].'
ORDER BY figure_number ASC';

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>