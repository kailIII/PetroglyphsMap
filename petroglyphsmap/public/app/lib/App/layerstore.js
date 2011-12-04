/**
* Method: createLayerStore
* Create a GeoExt layer store.
*
* Returns:
* {GeoExt.data.LayerStore} The layer store.
*
*/
var createLayerStore = function(layers) {
	return new GeoExt.data.LayerStore({
		map: map,
		layers: layers
	});
};