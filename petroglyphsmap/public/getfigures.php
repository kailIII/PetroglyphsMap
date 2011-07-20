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
$rockid = $_POST['rockid'];

/*
* Postgres query
*/
if( ($_POST['checkbox'] == 'true') && ($_SESSION['identitystring'] != '') ) // si l'on a choisi d'appliquer le filtre à l'affichage des roches, et que le filtre est bien renseigné
    $filter = " AND UPPER(figure.identity) LIKE UPPER('".$_SESSION['identitystring']."') ";
else // else nothing is filtered
    $filter = '';

$query = "
    SELECT figure_number, face, identity, alternative_identity
    FROM figure
    WHERE figure.rock_id = ".$rockid.$filter."
    ORDER BY face, figure_number";

$result = pg_query($sessionpg, $query);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>