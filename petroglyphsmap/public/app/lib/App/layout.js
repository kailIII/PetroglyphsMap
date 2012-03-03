/*
* @include OpenLayers/Map.js
* @include OpenLayers/Projection.js
* @include OpenLayers/Layer/XYZ.js
* @include OpenLayers/Tile/Image.js
* @include OpenLayers/Control/Navigation.js
* @include OpenLayers/Control/ZoomBox.js
* @include OpenLayers/Control/NavigationHistory.js
* @include GeoExt/data/LayerStore.js
* @include GeoExt/widgets/MapPanel.js
* @include GeoExt/widgets/Action.js
* @include GeoExt/widgets/ZoomSlider.js
* @include GeoExt/widgets/tips/ZoomSliderTip.js
* @include GeoExt/widgets/tree/LayerContainer.js
*/

Ext.namespace("App");
OpenLayers.ProxyHost="proxy.php?url=";

App.layout = (function() {
    return {
        /*
        * APIMethod: init
        * Initialize the page layout.
        */
        init: function() {

            map = createMap();
            var layers = createLayers();
            layerStore = createLayerStore(layers);
            
            addMapControls();
			var layerPanel = createLayerPanel();
            var filterPanel = createFilter();
            var cartoPanel = createCarto();
            var creditsPanel = createCredits();

            // General Viewport of application
            new Ext.Viewport({
                renderTo: "mapDiv",
                layout: "border",
                items: [{
                    region: "center",
                    id: "mapdiv",
                    xtype: "gx_mappanel",
                    map: map,
                    layers: layerStore,
                    center: center,
                    zoom: 2,
                    tbar: createTbarItems()
                }, {
                    region:'west',
                    split: false,
                    width: 250,
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [layerPanel, filterPanel, cartoPanel, creditsPanel]
                }]
            });
        }
    };
})();
