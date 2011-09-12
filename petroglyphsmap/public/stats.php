<?php

session_start ();

$map_path = 'C:\\ms4w\\Apache\\htdocs\\';

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // no time limit
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres");

/*
* Useful variables
*/
$stattype = $_POST['stattype'];
$scale = $_POST['scale'];
$filterstring = $_POST['filterstring'];
$id = $_POST['log'];

if($filterstring != null) {
    $filterstring = str_replace('*', '%', $_POST['filterstring']);
    $filter = "WHERE UPPER(figure.identity) LIKE UPPER('".$filterstring."')";
} else
    $filter = '';

if ($scale == 'Zone') {

    $typename = 'zones';
    $viewname = "zonestats".$id; // name of unique view to be created
    $mapname = "tmp/wfs_zonestats".$id.".map"; // name of unique mapfile to be created

    $_SESSION['zonestats'] = $viewname;

    /*
    * New temporary Mapfile, specific to the filter
    */
    $map = ms_newMapObj($map_path."wfs_zonestats.map"); // WFS reference mapfile, to create the view mapfile
    $map->setMetaData('wfs_onlineresource', 'http://127.0.0.1/cgi-bin/mapserv.exe?map=tmp/wfs_'.$viewname.'.map'); // modifying the url value
    $zones = $map->getLayerByName("zones"); // modifying the 'zones' layer
    $zones->set('data', 'geo_centroid FROM (select zone_id, zone_number, geo_centroid, nb from '.$viewname.') as subquery using unique zone_id using srid=2154');
    // only the talbe name (view) is changed, where the result will be stored
    $map->save($mapname); // saved in 'tmp' file

    /*
    * Postgres view
    */
    if ($stattype == 'Nombre de roches') {
        $query_view = "
            CREATE OR REPLACE VIEW ".$viewname." AS
            SELECT zone.zone_id, zone.zone_number, zone.geo_centroid, CAST(count(t1.rock_id) AS bigint) nb
            FROM (
                SELECT rock.rock_id, rock.group_id
                FROM rock left join figure on (figure.rock_id=rock.rock_id) ".$filter."
                GROUP BY rock.rock_id, rock.group_id) AS t1, zone, ".'"group"'."
            WHERE t1.group_id=".'"group"'.".group_id
            AND ".'"group"'.".zone_id = zone.zone_id
            GROUP BY zone.zone_id, zone.zone_number, zone.geo_centroid
            ORDER BY zone.zone_number
        ";
    } else {
        $query_view = "
            CREATE OR REPLACE VIEW ".$viewname." AS
            SELECT zone.zone_id, zone.zone_number, zone.geo_centroid, CAST(sum(t1.nfig) AS bigint) nb
            FROM (
                SELECT rock.rock_id, rock.group_id, count(figure.figure_id) nfig
                FROM rock left join figure on (figure.rock_id=rock.rock_id) ".$filter."
                GROUP BY rock.rock_id, rock.group_id) AS t1, zone, ".'"group"'."
            WHERE t1.group_id=".'"group"'.".group_id
            AND ".'"group"'.".zone_id = zone.zone_id
            GROUP BY zone.zone_id, zone.zone_number, zone.geo_centroid
            ORDER BY zone.zone_number
        ";
    }    
    
} else {

    $typename = 'rocks';
    $viewname = "rockstats".$id; // name of unique view to be created
    $mapname = "tmp/wfs_rockstats".$id.".map"; // name of unique mapfile to be created

    $_SESSION['rockstats'] = $viewname;

    /*
    * New temporary Mapfile, specific to the filter
    */
    $map = ms_newMapObj($map_path."wfs_rockstats.map"); // WFS reference mapfile, to create the view mapfile
    $map->setMetaData('wfs_onlineresource', 'http://127.0.0.1/cgi-bin/mapserv.exe?map=tmp/wfs_'.$viewname.'.map'); // modifying the url value
    $rocks = $map->getLayerByName("rocks"); // modifying the 'rocks' layer
    $rocks->set('data', 'geo_point FROM (select rock_id, rock_number, geo_point, nb from '.$viewname.') as subquery using unique rock_id using srid=2154');
    $map->save($mapname); // saved in 'tmp' file

    /*
    * Postgres view
    */
    $query_view = "
        CREATE OR REPLACE VIEW ".$viewname." AS
        SELECT rock.rock_id, rock.rock_number, rock.geo_point, CAST(count(figure.figure_id) AS bigint) nb
        FROM rock left join figure on (figure.rock_id=rock.rock_id) ".$filter."
        GROUP BY rock.rock_id, rock.rock_number, rock.geo_point
    ";
}

pg_query($sessionpg, $query_view);
    
/*
* Max and min value for cartography to come
*/
$query_maxmin = "
    SELECT MAX(nb), MIN(nb)
    FROM ".$viewname."
    WHERE nb > 0";
$result = pg_query($sessionpg, $query_maxmin);

$row = pg_fetch_row($result);
$max = $row[0];
$min = $row[1];

/*
* JSON response
*/
$data = array ("success"=>true, "mapfile"=>$mapname, "viewname"=>$viewname, "typename"=>$typename, "scale"=>$scale, "stattype"=>$stattype, "min"=>$min, "max"=>$max);
echo json_encode($data);

?>