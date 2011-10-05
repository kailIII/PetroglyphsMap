<?php

include 'config.php';

/*
* Delete the views and mapfiles, if views have been created
*/
if (isset($_SESSION['zonestats'])) { // if a view exists, delete it
    if ($query!='') {
        $query = $query.", ".$_SESSION['zonestats'];  // query now contains more than one view
    } else {
        $query = 'DROP VIEW '.$_SESSION['zonestats'];
    }
    
    $mapfile = "tmp/wfs_".$_SESSION['zonestats'].".map"; // delete temporary mapfile
    unlink($mapfile);
}

if (isset($_SESSION['rockstats']))  { // if a view exists, delete it
    if ($query!='') {
        $query = $query.", ".$_SESSION['rockstats'];  // query now contains more than one view
    } else {
        $query = 'DROP VIEW '.$_SESSION['rockstats'];
    }
    
    $mapfile = "tmp/wfs_".$_SESSION['rockstats'].".map"; // delete temporary mapfile
    unlink($mapfile);
}

pg_query($sessionpg, $query);

unset($_SESSION['zonestats']);
unset($_SESSION['rockstats']);

?>