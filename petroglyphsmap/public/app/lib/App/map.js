/**
* Method: createMap
* Create the map.
*
* Returns:
* {OpenLayers.Map} The OpenLayers.Map instance
*/
var createMap = function() {
	
	// Center definition : Vallée des Merveilles
	center = new OpenLayers.LonLat(7.4436, 44.0592);    // in WGS84 (longitude latitude)
	center.transform(epsg4326, proj_geop);  // center is now in geoportal projection
	
	// Maximum extension for the GIS
	var maxEx = new OpenLayers.Bounds(1050000, 6330000, 1070000, 6360000).transform(lambert93, proj_geop);
	var restEx = maxEx.clone();
	
	// Map object
	return new OpenLayers.Map({
		resolutions: Geoportal.Catalogue.RESOLUTIONS.slice(12, 18),
		projection: proj_geop,
		displayProjection: lambert93,
		units: proj_geop.getUnits(),
		maxExtent: maxEx,
		restrictedExtent: restEx,
		controls: [
			new OpenLayers.Control.ScaleLine({
				bottomOutUnits: '',
				bottomInUnits: ''
			}),
			new OpenLayers.Control.Attribution()
		]
	});
};