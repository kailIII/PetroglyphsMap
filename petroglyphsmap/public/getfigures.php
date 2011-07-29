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
if( ($_POST['checkbox'] == 'true') && ($_SESSION['identitystring'] != '') ) // si l'on a choisi d'appliquer le filtre à l'affichage des roches, et que le filtre est bien renseigné
    $filter = " AND UPPER(figure.identity) LIKE UPPER('".$_SESSION['identitystring']."') ";
else // else nothing is filtered
    $filter = '';

if ($type == 'r') {   // rock analysis
    $query = "
        SELECT figure_number, face, identity, alternative_identity
        FROM figure
        WHERE figure.rock_id = ".$id.$filter."
        ORDER BY face, figure_number";
} elseif ($type == 'z') {   // zone analysis
    $query = '
        SELECT group_number, rock_number, figure_number, face, identity, alternative_identity
        FROM "group", rock, figure
        WHERE figure.rock_id = rock.rock_id
        AND rock.group_id = "group".group_id
        AND "group".zone_id = '.$id.$filter."
        ORDER BY group_number, rock_number, face, figure_number";

}

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>