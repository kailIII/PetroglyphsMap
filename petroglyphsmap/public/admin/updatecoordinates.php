<?php

include '../config.php';

/*
* Postgres query
*/
// Check if the rock already exists
$query0 = "SELECT rock.rock_id
    FROM rock
    WHERE rock.rock_number LIKE '".$_POST['rocknumber']."'
    AND rock.group_id = ". $_POST['groupid'];

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