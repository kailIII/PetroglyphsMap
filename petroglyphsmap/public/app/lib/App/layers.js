/**
* Method: createLayers
* Create the layers.
*
* Returns:
* {Array({OpenLayers.Layer}) Array of layers.
*/
var createLayers = function() {

	//
	// Configuration of the map and layers
	//
	
	// GeoRM : Geoportail licence definition
	var myGeoRM = Geoportal.GeoRMHandler.addKey(
		gGEOPORTALRIGHTSMANAGEMENT.apiKey,
		gGEOPORTALRIGHTSMANAGEMENT[gGEOPORTALRIGHTSMANAGEMENT.apiKey].tokenServer.url,
		gGEOPORTALRIGHTSMANAGEMENT[gGEOPORTALRIGHTSMANAGEMENT.apiKey].tokenServer.ttl,
		map
	);
	
	// Rocks default stylemap
	var rock_context = {
		getSize : function(feature){
			if(map.getZoom() < 3) {
				return("0.7");
			} else {
				return("4");
			}
		}
	};
	var rock_template = {
		pointRadius: "${getSize}",
		fillColor: "blue",
		fillOpacity: 0.4,
		strokeWidth: 0.5,
		strokeColor: "blue"
		};

	styleMap_rock = new OpenLayers.StyleMap(new OpenLayers.Style(rock_template, {context:rock_context}) );
	
	// Rocks stylemap with label (option)
	styleMap_rock_label = new OpenLayers.StyleMap({
		pointRadius: 4,
		fillColor: "blue",
		fillOpacity: 0.4,
		strokeWidth: 0.5,
		strokeColor: "blue",
		label : "${rock_number}",
		fontColor: "white",
		fontSize: "12px",
		fontFamily: "Courier New, monospace",
		fontWeight: "bold",
		labelAlign: "rb"
	});
	
	//
	// Layers
	//
	
	// IGN Ortho WMS - API Géoportail
	var orthos = new Geoportal.Layer.WMSC(
		'Ortho IGN',
		gGEOPORTALRIGHTSMANAGEMENT[gGEOPORTALRIGHTSMANAGEMENT.apiKey]
			  .resources['ORTHOIMAGERY.ORTHOPHOTOS:WMSC'].url,
		{
		  layers: 'ORTHOIMAGERY.ORTHOPHOTOS',
		  format:'image/jpeg',
		  exceptions:"text/xml"
		},
		{
		  isBaseLayer: true,
		  visibility: true,
		  GeoRM: myGeoRM
		}
	);
	
	// IGN Scan25 WMS - API Géoportail
	var scans =  new Geoportal.Layer.WMSC(
		'Carte IGN',
		gGEOPORTALRIGHTSMANAGEMENT[gGEOPORTALRIGHTSMANAGEMENT.apiKey]
			  .resources['GEOGRAPHICALGRIDSYSTEMS.MAPS:WMSC'].url,
		{
			layers: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			format:'image/jpeg',
			exceptions:"text/xml"
		},
		{
			isBaseLayer: true,
			visibility: false,
			GeoRM: myGeoRM
		}
	);
	
	// Zone WFS - custom MapServer
	zone_lyr = new OpenLayers.Layer.WFS(
		"Zones",
		myWFS,
		{
			typename: 'zones'
		},
		{
			visibility: false,  // defaults is not visible
			projection: lambert93,
			extractAttributes: true
		}
	);
	
	// Rock WFS - custom MapServer
	rock_lyr = new OpenLayers.Layer.WFS(
		"Roches<span id='rockstatus'></span>",
		myWFS,
		{
			typename: 'rocks'
		},
		{
			visibility: false,  // defaults is not visible
			styleMap: styleMap_rock,
			projection: lambert93,
			extractAttributes: true
		}
	);
	
	return [orthos, scans, zone_lyr, rock_lyr];
};