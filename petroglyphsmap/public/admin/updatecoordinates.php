<?php

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // Aucune limite d'execution
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres"); // Base géographique du Bego

/*
* Postgres query
*/
// Check if the rock already exists
$query0 = 'SELECT rock.rock_id
    FROM rock, "group", zone '.
    "WHERE rock.rock_number LIKE '".$_POST['rocknumber']."' ".
    'AND rock.group_id = "group".group_id
    AND "group".group_number = '.$_POST['groupnumber'].'
    AND "group".zone_id = zone.zone_id
    AND zone.zone_number = '.$_POST['zonenumber'];

$result = pg_query($sessionpg, $query0);
$row = pg_fetch_row($result);

if (!$row) {
    echo "Cette roche n'est pas encore sur la base de données.\n";
    exit;
} else {
    $query = "UPDATE rock
        SET point_x = ".$_POST['x'].", point_y = ".$_POST['y'].", point_z = ".$_POST['z'].", geo_point = ST_GeomFromText('POINT(".$_POST['x']." ".$_POST['y'].")', 2154)
        WHERE rock.rock_id = ".$row[0];    
    pg_query($sessionpg, $query);
}

?>