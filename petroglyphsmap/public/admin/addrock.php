<?php

include '../config.php';

/*
* Postgres query
*/

// Check if the rock already exists
$query0 = 'SELECT rock.rock_id
    FROM rock, "group", zone '.
    "WHERE rock.rock_number LIKE '".$_POST['rocknumber']."' ".
    'AND rock.group_id = '.$_POST['groupid'];

$result = pg_query($sessionpg, $query0);

if (!pg_fetch_row($result)) {
    $query = "INSERT INTO rock (rock_number, group_id, point_x, point_y, point_z, year, geo_point) VALUES (
        '".$_POST['rocknumber']."', ".
        $_POST['groupid'].', '.
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