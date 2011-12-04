<?php

include '../config.php';

/*
* Postgres query
*/

// Check if the figure already exists
$query0 = "SELECT figure.figure_id
    FROM figure, rock
    WHERE figure.figure_number LIKE '".$_POST['figurenumber']."'
    AND figure.rock_id = rock.rock_id
    AND rock.rock_id = ".$_POST['rockid'];
    
$result = pg_query($sessionpg, $query0);

// Adding the figure to the database
if (!pg_fetch_row($result)) {
    $query = "INSERT INTO figure (figure_number, rock_id, identity, alternative_identity, face) VALUES (
        '".$_POST['figurenumber']."',
		".$_POST['rockid'].",
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