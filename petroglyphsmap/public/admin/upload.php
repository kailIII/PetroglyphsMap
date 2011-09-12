<?php

/*
* Initialize SQL query
*/
ini_set ('max_execution_time', 0); // Aucune limite d'execution
$sessionpg = pg_connect("host=localhost port=5432 dbname=begogeo user=postgres password=postgres"); // Base géographique du Bego

/*
* Postgres query
*/

if( isset($_POST['figurenumber']) ) {   // the picture is for a figure
    $query = 'SELECT zone_number, group_number, rock_number, figure_number
    FROM zone, "group", rock, figure
    WHERE figure.figure_id = '.$_POST['figurenumber'].'
    AND figure.rock_id = rock.rock_id
    AND rock.group_id = "group".group_id
    AND "group".zone_id = zone.zone_id';
} else {   // the picture is for a rock
    $query = 'SELECT zone_number, group_number, rock_number
    FROM zone, "group", rock
    WHERE rock.rock_id = '.$_POST['rocknumber'].'
    AND rock.group_id = "group".group_id
    AND "group".zone_id = zone.zone_id';
}

$result = pg_query($sessionpg, $query);
$row = pg_fetch_row($result);

if( isset($_POST['submit']) ) {
    if( isset($_POST['figurenumber']) ) {
        $content_dir = '../photos/Z'.$row[0].'/G'.$row[1].'/R'.$row[2].'/'; // file where the image will be stored
    } else {
        $content_dir = '../photos/Z'.$row[0].'/G'.$row[1].'/';
    }
    
    if(!is_dir ('../photos')) {
        mkdir('../photos');
    }
    
    if(!is_dir ('../photos/Z'.$row[0])) {
        mkdir('../photos/Z'.$row[0]);
    }
    
    if(!is_dir ('../photos/Z'.$row[0].'/G'.$row[1])) {
        mkdir('../photos/Z'.$row[0].'/G'.$row[1]);
    }
    
    if(isset($_POST['figurenumber']) && !is_dir('../photos/Z'.$row[0].'/G'.$row[1].'/R'.$row[2])) {    // the directory is for a figure
        mkdir('../photos/Z'.$row[0].'/G'.$row[1].'/R'.$row[2]);
    }
    
    // Function to find the extension of a file
    function findexts ($filename){
        $filename = strtolower($filename);
        $exts = split("[/\\.]", $filename);
        $n = count($exts)-1;
        $exts = $exts[$n];
        
        return $exts;
    }
    
    $ext = findexts ($_FILES['fichier']['name']);
    if( isset($_POST['figurenumber']) ) {
        $filename = 'Fig'.$row[3].'.';
    } else {
       $filename = 'R'.$row[2].'.';
    }
    
    $tmp_file = $_FILES['fichier']['tmp_name'];

    if(!is_uploaded_file($tmp_file)){
        exit("Le fichier est introuvable");
    }

    // checking the extension
    $type_file = $_FILES['fichier']['type'];
    if( !strstr($type_file, 'jpg') && !strstr($type_file, 'jpeg') && !strstr($type_file, 'bmp') && !strstr($type_file, 'gif') && !strstr($type_file, 'png') ){
        exit("Le fichier n'est pas une image");
    }

    // copying the temp file to the final folder
    $name_file = $filename.$ext;

    if(!move_uploaded_file($tmp_file, $content_dir . $name_file)){
        exit("Impossible de copier le fichier dans $content_dir");
    }

    echo "Le fichier a bien été uploadé";
} else {
    echo "Erreur";
}

?>