<?php

include 'config.php';

/*
* Delete the views and mapfiles, if views have been created
*/

if (isset($_SESSION['rockview'])) {
    $query = 'DROP VIEW '.$_SESSION['rockview'];
    
    $mapfile = "tmp/wfs_".$_SESSION['rockview'].".map"; // delete temporary mapfile
    unlink($mapfile);
}

pg_query($sessionpg, $query);

unset($_SESSION['identitystring']);
unset($_SESSION['rockview']);

?>