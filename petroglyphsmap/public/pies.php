<?php

session_start ();

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // no time limit
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres");

/*
* Useful variables
*/
$type = $_POST['type'];
$id = $_POST['id'];

/*
* Postgres query
*/
if ($type == 'r') { // zone analysis
    $query = '
        SELECT UPPER(SUBSTRING(figure.identity from 1 for 1)) AS type, COUNT(figure.figure_id)
        FROM figure, rock
        WHERE figure.rock_id = rock.rock_id
        AND rock.rock_id = '.$id.'
        GROUP BY type
        ORDER BY type';
} elseif ($type == 'z') {   // rock analysis
    $query = '
        SELECT UPPER(SUBSTRING(figure.identity from 1 for 1)) AS type, COUNT(figure.figure_id)
        FROM figure, rock, "group", zone
        WHERE figure.rock_id = rock.rock_id
        AND rock.group_id = "group".group_id
        AND "group".zone_id = zone.zone_id
        AND zone.zone_number = '.$id.'
        GROUP BY type
        ORDER BY type';
}

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>