<?php

include 'config.php';

/*
* Useful variables
*/
$identitystring = '';
$identitytype = '';

if($_POST['identitystring'] != '') {
	$identitystring = str_replace('*', '%', $_POST['identitystring']); // asked figure code is fetch from the form, and "*" is replaced by "%" (for SQL)
	$identitytype = 'identity';
} elseif ($_POST['identitystring2'] != '') {
	$identitystring = str_replace('*', '%', $_POST['identitystring2']);
	$_SESSION['identitystring'] = $identitystring;
	$identitytype = 'alternative_identity';
}

$_SESSION['identitystring'] = $identitystring;
$_SESSION['identitytype'] = $identitytype;

$zonenb = $_POST['zonecombo'];
$viewname = "rockview".session_id(); // unique view name that will be generated
$mapname = "tmp/wfs_rockview".session_id().".map"; // unique mapfile name that will be generated

$_SESSION['rockview'] = $viewname;

/*
* New temporary Mapfile, specific to the filter
*/
$map = ms_newMapObj($map_path."wfs_rockview.map"); // reference mapfile WFS to create the view
$map->setMetaData('wfs_onlineresource', 'http://127.0.0.1/cgi-bin/mapserv.exe?map=C:\ms4w\Apache\htdocs\tmp\wfs_'.$viewname.'.map'); // modifying WFS url
$rocks = $map->getLayerByName("rocks"); // modifying 'orcks' layer
$rocks->set('data', 'geo_point FROM ( select r.rock_id, r.rock_number, r.point_x, r.point_y, r.point_z, r.geo_point, r.year, g.group_number, z.zone_number from '.$viewname.' r join ("group" g join zone z on g.zone_id=z.zone_id) on r.group_id = g.group_id ) as subquery using unique rock_id using srid=2154');
// we only change the name of the table (actually, a view) where the data will be stored
$map->save($mapname); // saving in the '/tmp' directory

/*
* Postgres view
*/
$query0 = "CREATE OR REPLACE VIEW $viewname AS
    SELECT rock.rock_id, rock.rock_number, rock.group_id, rock.point_x, rock.point_y, rock.point_z, rock.year, rock.geo_point";

if (($identitystring != '') && is_numeric($zonenb)) {
    $query1 = '
		FROM zone, "group", rock, figure'."
        WHERE UPPER(figure.$identitytype) LIKE UPPER('$identitystring')
        AND figure.rock_id = rock.rock_id".'
        AND rock.group_id = "group".group_id
        AND "group".zone_id = zone.zone_id
        AND zone.zone_number = '.$zonenb;
} elseif ($identitystring != '') {
    $query1 = "
		FROM rock, figure
        WHERE UPPER(figure.$identitytype) LIKE UPPER('$identitystring')
        AND figure.rock_id = rock.rock_id" ;
} elseif (is_numeric($zonenb)) {
    $query1 = '
		FROM zone, "group", rock
        WHERE rock.group_id = "group".group_id
        AND "group".zone_id = zone.zone_id
        AND zone.zone_number = '.$zonenb;
} else {
    $data = array ("success"=>false);
    echo json_encode($data);
    exit;
}

$query_view = $query0.$query1."
    GROUP BY rock.rock_id, rock.rock_number, rock.group_id, rock.point_x, rock.point_y, rock.point_z, rock.year, rock.geo_point";
pg_query($sessionpg, $query_view);

/*
* JSON response
*/
$data = array ("success"=>true, "mapfile"=>$mapname, "viewname"=>$viewname);
echo json_encode($data);

?>