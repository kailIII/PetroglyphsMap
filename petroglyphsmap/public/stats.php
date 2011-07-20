<?php

session_start ();

/*
* Initialisation de la requête SQL
*/
ini_set ('max_execution_time', 0); // Aucune limite d'execution
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres"); // Base géographique du Bego

/*
* Variables utiles
*/
$stattype = $_POST['stattype'];
$scale = $_POST['scale'];
$identitystring = $_POST['identitystring2'];

$id = $_SESSION['idconnexion']; // identifiant donné par la session php
if($identitystring != null) {
    $identitystring = str_replace('*', '%', $_POST['identitystring']);
    $filter = "WHERE UPPER(figure.identity) LIKE UPPER('".$identitystring."')";
} else
    $filter = '';

if ($scale == 'Zone') {

    $typename = 'zones';
    $viewname = "zonestats".$id; // nom de la vue unique qui va être créée
    $mapname = "tmp/wfs_zonestats".$id.".map"; // nom du mapfile unique qui va être créé

    $_SESSION['zonestats'] = $viewname;

    /*
    * Création d'un nouveau Mapfile temporaire, spécifique au filtre
    */
    $map = ms_newMapObj("wfs_zonestats.map"); // mapfile WFS de référence pour créer la vue
    $zones = $map->getLayerByName("zones"); // on modifie le layer 'zones'
    $zones->set('data', 'geo_centroid FROM (select zone_id, zone_number, geo_centroid, nb from '.$viewname.') as subquery using unique zone_id using srid=2154');
    // on ne change que le nom de la table (vue) où vont être stockées les données de la requête
    $map->save($mapname); // sauvagarde dans le dossier /tmp

    /*
    * Création de la vue postgres
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
    $viewname = "rockstats".$id; // nom de la vue unique qui va être créée
    $mapname = "tmp/wfs_rockstats".$id.".map"; // nom du mapfile unique qui va être créé

    $_SESSION['rockstats'] = $viewname;

    /*
    * Création d'un nouveau Mapfile temporaire, spécifique au filtre
    */
    $map = ms_newMapObj("wfs_rockstats.map"); // mapfile WFS de référence pour créer la vue
    $map->setMetaData('wfs_onlineresource', 'http://127.0.0.1/cgi-bin/mapserv.exe?map=tmp/wfs_'.$viewname.'.map'); // on modifie le chemin d'accès URL
    $rocks = $map->getLayerByName("rocks"); // on modifie le layer 'rocks'
    $rocks->set('data', 'geo_point FROM (select rock_id, rock_number, geo_point, nb from '.$viewname.') as subquery using unique rock_id using srid=2154');
    $map->save($mapname); // sauvagarde dans le dossier /tmp

    /*
    * Création de la vue postgres
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
* Recherche de la valeur max et min pour la cartographie à venir
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
* Réponse JSON
*/
$data = array ("success"=>true, "mapfile"=>$mapname, "viewname"=>$viewname, "typename"=>$typename, "scale"=>$scale, "stattype"=>$stattype, "min"=>$min, "max"=>$max);
echo json_encode($data);

?>