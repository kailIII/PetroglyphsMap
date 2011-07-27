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
if (isset($_SESSION['zonestats'])) { // if a view exists, delete it
    if ($querybool) {
        $query = $query.", ".$_SESSION['zonestats'];  // query now contains more than one view
    } else {
        $query = 'DROP VIEW '.$_SESSION['zonestats'];
        $querybool = true;  // query now contains at least one view
    }
    
    $mapfile = "tmp/wfs_".$_SESSION['zonestats'].".map"; // delete temporary mapfile
    unlink($mapfile);
}

if (isset($_SESSION['rockstats']))  { // if a view exists, delete it
    if ($querybool) {
        $query = $query.", ".$_SESSION['rockstats'];  // query now contains more than one view
    } else {
        $query = 'DROP VIEW '.$_SESSION['rockstats'];
        $querybool = true;  // query now contains at least one view
    }
    
    $mapfile = "tmp/wfs_".$_SESSION['rockstats'].".map"; // delete temporary mapfile
    unlink($mapfile);
}

pg_query($sessionpg, $query);

unset($_SESSION['zonestats']);
unset($_SESSION['rockstats']);

?>