
/*
 * @include App/layout.js
 */

Ext.namespace("App");

(function() {

    // global settings
    OpenLayers.ImgPath = "lib/openlayers/img";
    Ext.QuickTips.init();

    // run App.layout.init() when the page
    // is ready
    Ext.onReady(function() {
        App.layout.init()
    });
})();
