<?php

session_start ();

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // Aucune limite d'execution
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres"); // Base géographique du Bego

/*
* Useful variables
*/
$identitystring = str_replace('*', '%', $_POST['identitystring']); // on récupère le code figure demandé dans le formulaire, en remplacant * par % (pour le SQL)
$_SESSION['identitystring'] = $identitystring;

$id = $_SESSION['idconnexion']; // identifiant donné par la session php

$viewname = "rockview".$id; // nom de la vue unique qui va être créée
$mapname = "tmp/wfs_rockview".$id.".map"; // nom du mapfile unique qui va être créé

$_SESSION['rockview'] = $viewname;

/*
* New temporary Mapfile, specific to the filter
*/
$map = ms_newMapObj("wfs_rockview.map"); // mapfile WFS de référence pour créer la vue
$map->setMetaData('wfs_onlineresource', 'http://127.0.0.1/cgi-bin/mapserv.exe?map=tmp/wfs_'.$viewname.'.map'); // on modifie le chemin d'accès URL
$rocks = $map->getLayerByName("rocks"); // on modifie le layer 'rocks'
$rocks->set('data', 'geo_point FROM ( select r.rock_id, r.rock_number, r.point_x, r.point_y, r.point_z, r.geo_point, r.year, r.nbfig, g.group_number, z.zone_number from '.$viewname.' r join ("group" g join zone z on g.zone_id=z.zone_id) on r.group_id = g.group_id ) as subquery using unique rock_id using srid=2154');
// on ne change que le nom de la table (vue) où vont être stockées les données de la requête
$map->save($mapname); // sauvagarde dans le dossier /tmp

/*
* Postgres view
*/
$query_view = "
    CREATE OR REPLACE VIEW ".$viewname." AS
    SELECT rock.rock_id, rock.rock_number, rock.group_id, rock.point_x, rock.point_y, rock.point_z, rock.year, rock.geo_point, count(figure_id) nbfig
    FROM rock, figure
    WHERE UPPER(figure.identity) LIKE UPPER('".$identitystring."')
    AND figure.rock_id = rock.rock_id
    GROUP BY rock.rock_id, rock.rock_number, rock.group_id, rock.point_x, rock.point_y, rock.point_z, rock.year, rock.geo_point
";
pg_query($sessionpg, $query_view);

/*
* JSON response
*/
$data = array ("success"=>true, "mapfile"=>$mapname, "viewname"=>$viewname);
echo json_encode($data);

?>