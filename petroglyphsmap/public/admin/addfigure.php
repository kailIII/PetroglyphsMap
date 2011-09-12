<?php

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // Aucune limite d'execution
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres"); // Base géographique du Bego

/*
* Postgres query
*/

// Check if the figure already exists
$query0 = 'SELECT figure.figure_id
    FROM figure, rock, "group", zone '.
    "WHERE figure.figure_number LIKE '".$_POST['figurenumber']."'
    AND figure.rock_id = rock.rock_id
    AND rock.rock_number LIKE '".$_POST['rocknumber']."' ".
    'AND rock.group_id = "group".group_id
    AND "group".group_number = '.$_POST['groupnumber'].'
    AND "group".zone_id = zone.zone_id
    AND zone.zone_number = '.$_POST['zonenumber'];
    
$result = pg_query($sessionpg, $query0);

// Adding the figure to the database
if (!pg_fetch_row($result)) {
    $query = "INSERT INTO figure (figure_number, rock_id, identity, alternative_identity, face) VALUES (
        '".$_POST['figurenumber']."', ".
        '(SELECT rock.rock_id
        FROM rock, "group", zone
        WHERE zone.zone_number = '.$_POST['zonenumber'].'
        AND "group".zone_id = zone.zone_id
        AND "group".group_number = '.$_POST['groupnumber'].'
        AND rock.group_id = "group".group_id '.
        "AND rock.rock_number LIKE '".$_POST['rocknumber']."'),
        '".$_POST['identity']."',
        '".$_POST['altidentity']."',
        '".$_POST['face']."'
    )";
    pg_query($sessionpg, $query);
} else {
    echo "Cette figure existe déjà sur la base de données.\n";
    exit;
}

// Adding picture on the network
include 'upload.php';

?>