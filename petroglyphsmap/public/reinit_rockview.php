<?php

session_start ();

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // no time limit
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres");
$query = '';
$querybool = false; // indicator to know if query has been written

/*
* Delete the views and mapfiles, if views have been created
*/

if (isset($_SESSION['rockview'])) {
    $query = 'DROP VIEW '.$_SESSION['rockview'];
    $querybool = true;  // query now contains at least one view
    
    $mapfile = "tmp/wfs_".$_SESSION['rockview'].".map"; // delete temporary mapfile
    unlink($mapfile);
}

pg_query($sessionpg, $query);

unset($_SESSION['identitystring']);
unset($_SESSION['rockview']);

?>