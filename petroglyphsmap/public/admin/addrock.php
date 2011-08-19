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

if (!pg_fetch_row($result)) {
    $query = "INSERT INTO rock (rock_number, group_id, point_x, point_y, point_z, year, geo_point) VALUES (
        '".$_POST['rocknumber']."', ".
        '(SELECT "group".group_id
        FROM "group", zone
        WHERE zone.zone_number = '.$_POST['zonenumber'].'
        AND "group".zone_id = zone.zone_id
        AND "group".group_number = '.$_POST['groupnumber'].'), '.
        $_POST['x'].', '.
        $_POST['y'].', '.
        $_POST['z'].', '.
        $_POST['year'].",
        ST_GeomFromText('POINT(".$_POST['x']." ".$_POST['y'].")', 2154)
    )";
    pg_query($sessionpg, $query);
} else {
    echo "Cette roche existe déjà sur la base de données.\n";
    exit;
}

?>