<?php

include 'config.php';

/*
* Useful variables
*/
$type = $_POST['type'];
$id = $_POST['id'];

/*
* Postgres query
*/
// First, find if the query filter is on the identitystring or identitystring2 attribute. The attribute name (figString) and its value (figValue) are set into variables.
if($_SESSION['identitystring'] != ''){
	$idenType = $_SESSION['identitytype'];
	$idenValue = $_SESSION['identitystring'];
} else
	$idenType = null;

// Test if the filter has to be applied to the table view, and if the filter value exists. Else, no filter.
if( ($_POST['filter_on'] == 'true') && ($idenType != null) )
    $filter = "AND UPPER(figure.$idenType) LIKE UPPER('$idenValue') ";
else
    $filter = '';

if ($type == 'r') {   // rock analysis
    $query_fig = "
        SELECT figure_number, face, identity, alternative_identity, 'http://127.0.0.1/photos/Z' || zone_number || '/G' || group_number || '/R' || rock_number || '/Fig' || figure_number || '.jpg' AS image".'
        FROM zone, "group", rock, figure
        WHERE figure.rock_id = '.$id.'
        AND rock.rock_id = '.$id.'
        AND rock.group_id = "group".group_id
        AND "group".zone_id = zone.zone_id '.$filter.'
        ORDER BY face, figure_number';
} elseif ($type == 'z') {   // zone analysis
    $query_fig = "
        SELECT group_number, rock_number, figure_number, face, identity, alternative_identity, 'http://127.0.0.1/photos/Z' || zone_number || '/G' || group_number || '/R' || rock_number || '/Fig' || figure_number || '.jpg' AS image".'
        FROM zone, "group", rock, figure
        WHERE figure.rock_id = rock.rock_id
        AND rock.group_id = "group".group_id
        AND "group".zone_id = '.$id.'
        AND zone.zone_id = '.$id.' '.$filter.'
        ORDER BY group_number, rock_number, face, figure_number';
}

$result = pg_query($sessionpg, $query_fig);

/*
* JSON response
*/
$data = pg_fetch_all($result);
echo json_encode($data);

?>