/**
* Global variables definition
*/

// Map variables
var map, center;
// Layer variables
var zone_lyr, rock_lyr, layerStore;
var propSymLyr = null;
// Windows variables
var propSym_popup, gridWin, pieWin;
var popup = null;
// Style variables
var styleMap_rock, styleMap_rock_label;
// PHP log
var phpsession = document.cookie.substring(10, document.cookie.length-1);    
// WFS mapfile variables
var myWFS = MSurl + mappath + 'wfs.map&'; // original WFS url

// Projection variables
var epsg4326 = new OpenLayers.Projection("EPSG:4326");
var lambert93 = new OpenLayers.Projection("EPSG:2154");
var proj_geop = new OpenLayers.Projection("IGNF:GEOPORTALFXX");