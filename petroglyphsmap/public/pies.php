<?php

include 'config.php';

/*
* Useful variables
*/
$type = $_POST['type'];
$id = $_POST['id'];

/*
* Postgres query
*/
if ($type == 'r') { // rock analysis
    $query_type = '
        SELECT UPPER(SUBSTRING(figure.identity from 1 for 1)) AS type, COUNT(figure.figure_id)
        FROM figure, rock
        WHERE figure.rock_id = rock.rock_id
        AND rock.rock_id = '.$id.'
        GROUP BY type
        ORDER BY type';
} elseif ($type == 'z') {   // zone analysis
    $query_type = '
        SELECT UPPER(SUBSTRING(figure.identity from 1 for 1)) AS type, COUNT(figure.figure_id)
        FROM figure, rock, "group"
        WHERE figure.rock_id = rock.rock_id
        AND rock.group_id = "group".group_id
        AND "group".zone_id = '.$id.'
        GROUP BY type
        ORDER BY count';
}

$result = pg_query($sessionpg, $query_type);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>