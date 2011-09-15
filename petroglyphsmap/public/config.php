<?php

session_start ();

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // no time limit
$sessionpg = pg_connect("host=#### port=#### dbname=#### user=#### password=####");

?>