<?php

session_start ();

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // no time limit
$sessionpg = pg_connect("host=localhost port=5432 dbname=#### user=#### password=p####");

/*
* Variables
*/
$map_path = 'C:\\ms4w\\Apache\\htdocs\\';
$query = '';

?>