<?php

session_start ();
$_SESSION['idconnexion'] = date('His').rand();

?>

<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>SIG des Merveilles</title>
        <meta http-equiv="content-Type" content="text/html; charset=iso-8859-1" />
        <meta name="content-language" content="fr" />
        <meta name="Author" content="Gabriel Vatin - ENSG">
        <meta name="Copyright" content="Laboratoire Départemental de Préhistoire du Lazaret">
        <meta name="Description" content="SIG des roches gravées de la Vallée des Merveilles - gestion, visualisation et analyse des données">

        <link rel="stylesheet" type="text/css" href="css/style.css"></link>
        <link rel="stylesheet" type="text/css" href="lib/ext/Ext/resources/css/ext-all.css"></link>
        <link rel="stylesheet" type="text/css" href="lib/ext/Ext/resources/css/xtheme-access.css"></link>
        <link rel="stylesheet" type="text/css" href="lib/openlayers/theme/default/style.css"></link>
        <link rel="stylesheet" type="text/css" href="app/css/main.css"></link>

        <script type="text/javascript" src="lib/ext/Ext/adapter/ext/ext-base.js"></script>

        <!-- debug mode (begin) -->
        <script type="text/javascript" src="lib/ext/Ext/ext-all-debug.js"></script>
        <script type="text/javascript" src="lib/openlayers/lib/OpenLayers.js"></script>
        <script type="text/javascript" src="lib/geoext/lib/GeoExt.js"></script>
        <script type="text/javascript" src="lib/mapfish/MapFish.js"></script>
        <script type="text/javascript" src="http://api.ign.fr/geoportail/api?v=1.2-e&amp;key=2163304362720605860&amp;includeEngine=false&amp;"></script>
        <script type="text/javascript" src="http://depot.ign.fr/geoportail/api/js/1.2/GeoportalExtended.js"></script>
        <script type="text/javascript" src="app/lib/App/layout.js"></script>
        <script type="text/javascript" src="app/lib/App/main.js"></script>
        <!-- debug mode (end) -->

        <!-- non debug mode (begin) -->
        <!--
        <script type="text/javascript" src="build/app.js"></script>
        -->
        <!-- non debug mode (end) -->
        
        <script type="text/javascript"> window.onbeforeunload = function(e){ $.post('reinit.php');} </script>

    </head>

    <body></body>
<html>
