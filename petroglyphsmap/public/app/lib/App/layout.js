
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
    /*
     * Private
     */
    
    var map, center, zone_lyr, rock_lyr, propSymLyr, myWFS, layerStore, popup, popup2;
    
    var epsg4326 = new OpenLayers.Projection("EPSG:4326");
    var lambert93 = new OpenLayers.Projection("EPSG:2154");
    var proj_geop = new OpenLayers.Projection("IGNF:GEOPORTALFXX");
    
    /**
    * Method: createMap
    * Create the map.
    *
    * Returns:
    * {OpenLayers.Map} The OpenLayers.Map instance.
    */
    var createMap = function() {
        
        // Center definition : Vallée des Merveilles
        center = new OpenLayers.LonLat(7.4436, 44.0592);    // in WGS84 (longitude latitude)
        center.transform(epsg4326, proj_geop);  // center is now in geoportal projection
        
        var maxEx = new OpenLayers.Bounds(1050010, 6330080, 1070000, 6349980).transform(lambert93, proj_geop);
        var restEx = maxEx.clone();
        
        return new OpenLayers.Map({
            resolutions: Geoportal.Catalogue.RESOLUTIONS.slice(13, 18),
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
        
        // WFS and WMS
        myWFS = 'http://127.0.0.1:80/cgi-bin/mapserv.exe?map=C:\\ms4w\\Apache\\htdocs\\wfs.map&';
        
        // Rocks stylemp
        var styleMap_rock = new OpenLayers.StyleMap({
            pointRadius: 4,
            fillColor: "blue",
            fillOpacity: 0.4,
            strokeWidth: 0.5,
            strokeColor: "blue"
        });
        
        // Figures stylemap
        var styleMap_fig = new OpenLayers.StyleMap({
            pointRadius: 2,
            fillColor: "yellow",
            fillOpacity: 0.2,
            strokeWidth: 0.3,
            strokeColor: "yellow"
        });
        
        //
        // Layers
        //
        
        // IGN Ortho WMS
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
        
        // IGN Scan25 WMS
        var scans =  new Geoportal.Layer.WMSC(
            'Cartes IGN',
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
        
        // Zone WFS
        zone_lyr = new OpenLayers.Layer.WFS(
            "Zones",
            myWFS,
            {
                typename: 'zones'
            },
            {
                visibility: false,
                projection: lambert93,
                extractAttributes: true
            }
        );
        
        // Rock WFS
        rock_lyr = new OpenLayers.Layer.WFS(
            "Roches<span id='rockstatus'></span>",
            myWFS,
            {
                typename: 'rocks'
            },
            {
                visibility: false,
                styleMap: styleMap_rock,
                projection: lambert93,
                extractAttributes: true
            }
        );
        
        return [orthos, scans, zone_lyr, rock_lyr];
    };

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
    
    
    /**
    * Method: addMapControls
    * Create controls for the map.
    *
    * Returns:
    * none
    *
    */
    var addMapControls = function() {        
        var navControl = new OpenLayers.Control.Navigation({
            type: OpenLayers.Control.TYPE_TOGGLE,
            zoomWheelEnabled: true
        });
        map.addControl(navControl);
        navControl.activate();
        
        // create select feature control for features
        var selectControl = new OpenLayers.Control.SelectFeature(
            [zone_lyr, rock_lyr],
            {
                onSelect: createPopup,
                onUnselect: destroyPopup
            }
        );
        map.addControl(selectControl);
        selectControl.activate();
        
        // define "createPopup" function
        function createPopup(feature) {
            var popup_title, popup_html;
            
            // description of the feature, according to its type
            if (feature.fid[0]=='z') {
                popup_title = "Zone";
                popup_html = "Zone "  + feature.attributes.zone_number;
            } else if (feature.fid[0]=='r') {
                popup_title = "Roche";
                popup_html = "Zone " + feature.attributes.zone_number + '<br/>'
                    + "Groupe " + feature.attributes.group_number + '<br/>'
                    + "Roche " + feature.attributes.rock_number + '<br/>'
                    + "X : " + feature.attributes.point_x + '<br/>'
                    + "Y : " + feature.attributes.point_y + '<br/>'
                    + "Z : " + feature.attributes.point_z + '<br/>'
                    + "Année de lever : " + feature.attributes.year + '<br/>'
                    + "<span id='list' class='link'>Tableau des figures</span><br/>"
                    + "<span id='list2' class='link'>Types des figures</span>";
            }
            
            popup = new GeoExt.Popup({
                title: popup_title,
                location: feature,
                autoWidth: true,
                autoHeight: true,
                padding: 5,
                html: popup_html,
                resizable: false,
                unpinnable: false,
                closable: true,
                map: map,
                feature: feature
            });
            
            popup.show();
            
            function createGrid(result, request) {
                var win;                
                var jsonData = Ext.util.JSON.decode(result.responseText);
                
                var store = new Ext.data.JsonStore ({
                    // store configs
                    autoDestroy: true,
                    storeId: 'store',
                    // reader configs
                    idIndex: 0,
                    fields: [
                        {name: 'face', type: 'string'},
                        {name: 'figure_number', type: 'string'},
                        {name: 'identity',     type: 'string'},
                        {name: 'alternative_identity',  type: 'string'}
                    ],
                    data: jsonData
                });
                
                // create the Grid
                var grid = new Ext.grid.GridPanel ({
                    store: store,
                    stateId: 'stateGrid',
                    columns: [
                        {
                            header: 'Face',
                            sortable: true, 
                            dataIndex: 'face',
                            width: 50
                        },
                        {
                            header: 'Figure',
                            sortable: true,
                            dataIndex: 'figure_number',
                            width: 50
                        },
                        {
                            header: 'Code',
                            sortable: true, 
                            dataIndex: 'identity',
                            width: 100
                        },
                        {
                            header: 'Code alternatif',
                            sortable: true,
                            dataIndex: 'alternative_identity',
                            width: 100
                        }
                    ],
                    autoHeight: true,
                    width: 300,
                    viewConfig: {
                        stripeRows: true
                    }
                });
                
                if (typeof(win) != "undefined") {
                    win.destroy();
                }
                
                // display the grid in a window
                win = new Ext.Window ({
                    title: 'Figures',
                    autoWidth: true,
                    autoScroll: true,
                    height: 400,
                    layout: 'fit',
                    x: 50,
                    y: 150,
                    items: grid,
                    shadow: true
                });
                
                win.show();
            }
            
            function createPie(result, request) {
                var win;
                var jsonData = Ext.util.JSON.decode(result.responseText);
                
                var store = new Ext.data.JsonStore ({
                    // store configs
                    autoDestroy: true,
                    storeId: 'store',
                    // reader configs
                    idIndex: 0,
                    fields: [
                        {name: 'type', type: 'string'},
                        {name: 'count', type: 'integer'}
                    ],
                    data: jsonData
                });
                
                // create the pie
                var piePanel = new Ext.Panel({
                    height: 300,
                    autoWidth: true,
                    items: {
                        xtype: 'piechart',
                        store: store,
                        dataField: 'count',
                        categoryField: 'type',
                        extraStyle: {
                            legend:{
                                display: 'right',
                                padding: 10,
                                border:{
                                   color: '#CBCBCB',
                                   size: 1
                                }
                            }
                        }
                    }
                });
                
                if (typeof(win) != "undefined") {
                    win.destroy();
                }
                
                // display the pie in a window
                win = new Ext.Window ({
                    title: 'Diagramme des types de figures',
                    width: 400,
                    autoHeight: true,
                    layout: 'fit',
                    items: piePanel,
                    shadow: true
                });
                
                win.show();
            }
            
            var list = document.getElementById('list');
            list.onclick = function() {
                // by default, checkbox is disabled
                if (document.getElementById('checkbox') == null) {
                    var bool = false;
                } else {
                    var bool = document.getElementById('checkbox').checked;
                }
                // get the figures from selected rock
                Ext.Ajax.request({
                    method: 'POST',
                    url: 'getfigures.php',
                    params: {
                        rockid: (feature.fid.split('.'))[1],
                        checkbox: bool
                    },
                    success: createGrid
                });
            };
            
            var list2 = document.getElementById('list2');
            list2.onclick = function() {
                // get the figures from selected rock
                Ext.Ajax.request({
                    method: 'POST',
                    url: 'pies.php',
                    params: {
                        type: 'r',
                        id: (feature.fid.split('.'))[1]
                    },
                    success: createPie
                });
            };
            
        }
        
        function destroyPopup(feature) {
            popup.destroy();
        }
    };
    
    /**
    * Method: addFilter
    * Create filter for the map.
    *
    * Returns:
    * Ext.FormPanel : The filter panel
    *
    */
    var createFilter = function() {
    
        // Figure filter : DB query and view creation
        var filterform = new Ext.FormPanel({
            title: 'Filtre',
            defaults: {
                autoWidth: true,
                autoHeight: true,
                layout: 'form'
            },
            items: [{
                title: 'Filtre figures',
                frame: true,
                id: 'filterform',
                labelAlign: 'left',
                items: [{
                    id: 'formstatus',
                    html: 'Filtre désactivé', // default status
                    autoHeight: true
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Code figure',
                    id: 'identitystring',
                    name: 'identitystring',
                    allowBlank: false,
                    msgTarget: 'side',
                    width: 110
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Filtrer la description des roches',
                    checked: false,
                    id: 'checkbox',
                    name: 'checkbox',
                    value: 'checkbox',
                    hideLabel: true
                }, {
                    xtype: 'button',
                    text: 'Filtrer',
                    handler: filterform_submit,
                    width: 100,
                    style: 'margin-left: auto; margin-right: auto; text-align: center;'
                }, {
                    xtype: 'button',
                    text: 'Réinitialiser',
                    handler: filterform_destroy,
                    width: 100,
                    style: 'margin-left: auto; margin-right: auto; text-align: center;'
                }]
            }, {
                title: 'Aide',
                collapsible: true,
                collapsed: true,
                frame: true,
                html: '<p><i>Code figure</i> : code des figures à afficher. Le caractère <i>*</i> représente tout texte.<br/>Ex : <i>c2*</i> pour rechercher les corniformes avec corps (tout code commençant par "C2").</p><p><i>Filtrer la description des roches</i> : la fiche descriptive des roches, activée par un clic, ne prendra en compte que les roches filtrées.</p>',
                cls: 'help-box'
            }]
        });
        
        function displayFilter(result, action) {
            var filtertxt = document.getElementById('identitystring').value;
            
            var obj = Ext.util.JSON.decode(action.response.responseText); // response object with the mapfile path for WFS
            rock_lyr.url = "http://127.0.0.1:80/cgi-bin/mapserv.exe?map=C:\\ms4w\\Apache\\htdocs\\" + obj.mapfile + "&";
            rock_lyr.redraw(); // new display of the map
            document.getElementById('formstatus').innerHTML = 'Filtre activé'; // status update
            document.getElementById('formstatus').className = 'filter-on';
            document.getElementById('rockstatus').innerHTML = '<img src="img/filter.png" alt="Filtre ' + filtertxt + '" title="Filtre ' + filtertxt + '"/>';
        }
        
        // Function to create a DB view from Rock table and display it on the map
        function filterform_submit() {
            if (typeof(popup) != 'undefined') {
                popup.destroy();
            }
            filterform.form.submit({
                url: 'rockview.php',
                method: 'POST',
                reset: false,
                failure: function(result, action) {
                    alert('Erreur');
                },
                success: displayFilter
            });
        }
        
        // Function to delete all filters
        function filterform_destroy() {
            if (typeof(popup) != null) {
                popup.destroy();
            }
            rock_lyr.url = myWFS; // back to default WFS (no filter)
            rock_lyr.redraw(); // new map display
            document.getElementById('formstatus').innerHTML = 'Filtre désactivé'; // status update
            document.getElementById('formstatus').className = 'x-panel';
            document.getElementById('rockstatus').innerHTML = '';
            document.getElementById('identitystring').value = null;

            // delete the created view from the DB and the temporary mapfile
            Ext.Ajax.request({
                method: 'POST',
                url: 'reinit.php'
            });
            
            filterform.getForm().reset();
        }
        
        return filterform;
    };
    
    /**
    * Method: createCarto
    * Create thematic map for analyzing the data
    *
    * Returns:
    * Ext.FormPanel The panel with a form to select the analysis to do, and to display the map and controls.
    */
    var createCarto = function() {
    
        var a, b;   // a and b are variables for calculating the symbol Size from the Value;
        
        var storeAnalysis = new Ext.data.ArrayStore({
            id: 3,
            autoLoad: false,
            pruneModifiedRecords: true,
            fields: [
                'anaNum',  // numeric value is the key
                'anaType'
            ]
        });
        
        var carto = new Ext.FormPanel({
            title: 'Carto',
            defaults: {
                autoWidth: true,
                autoHeight: true,
                layout: 'form'
            },
            items: [{
                title: 'Statistiques',
                id: 'carto',
                frame: true,
                labelAlign: 'left',
                items: [{
                    xtype: 'combo',
                    id: 'scale',
                    name: 'scale',
                    width: 200,
                    hideLabel: true,
                    typeAhead: true,
                    lazyRender: true,
                    editable: false,
                    triggerAction: 'all',   // keep all the records when an item is selected
                    mode: 'local',
                    emptyText: 'Maille',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: [
                            'myId', // numeric value is the key
                            'name'  // name of the element to study
                        ],
                        data: [[1, 'Zone'], [2, 'Roche']]
                    }),
                    valueField: 'myId',
                    displayField: 'name',
                    allowBlank: false,
                    msgTarget: 'side',
                    listeners: {
                        select: function(combo, value) {                                                        // when an item is selected...
                            storeAnalysis.removeAll();                                                          // empty the 2n combobox
                            Ext.getCmp('analist').clearValue();                                                 // empty the text
                            if (value.id == 1) {                                                                // if it is analysis on rocks
                                storeAnalysis.loadData([[5, 'Nombre de roches'], [6, 'Nombre de figures']]);    // two kinds of analysis
                            } else if (value.id == 2) {                                                         // if it is analysis on rocks
                                storeAnalysis.loadData([[6, 'Nombre de figures']]);                             // just one kind of analysis
                            }
                            Ext.getCmp('analist').enable();
                        }
                    }
                }, {
                    xtype: 'combo',
                    id: 'analist',
                    name: 'stattype',
                    width: 200,
                    hideLabel: true,
                    disabled: true,
                    typeAhead: true,
                    lazyRender: true,
                    editable: false,
                    triggerAction: 'all',
                    mode: 'local',
                    emptyText: 'Indicateur',
                    store: storeAnalysis,
                    valueField: 'anaNum',
                    displayField: 'anaType',
                    allowBlank: false,
                    msgTarget: 'side'
                }, {
                    xtype: 'sliderfield',
                    name: 'minsize',
                    id: 'minsize',
                    fieldLabel: 'Rayon minimal',
                    labelStyle: 'width: auto;',
                    tipText: function(thumb){
                        return String(thumb.value) + ' px';
                    },
                    value: 1    // by default, the min size is 1px
                }, {
                    xtype: 'sliderfield',
                    name: 'maxsize',
                    id: 'maxsize',
                    fieldLabel: 'Rayon maximal',
                    labelStyle: 'width: auto;',
                    tipText: function(thumb){
                        return String(thumb.value) + ' px';
                    },
                    value: 30   // by default, the max size is 30px
                }, {
                    xtype: 'textfield',
                    width: 120,
                    fieldLabel: '<i>Code figure (facultatif)</i>',
                    id: 'identitystring2',
                    name: 'identitystring2',
                    allowBlank: true,
                }, {
                    xtype: 'button',
                    text: 'Afficher',
                    width: 100,
                    style: 'margin-left: auto; margin-right: auto; text-align: center;',
                    handler: carto_submit
                }, {
                    xtype: 'button',
                    text: 'Supprimer',
                    width: 100,
                    style: 'margin-left: auto; margin-right: auto; text-align: center;',
                    handler: carto_destroy
                }]
            }, {
                title: 'Aide',
                collapsible: true,
                collapsed: true,
                frame: true,
                html: "<p><i>Maille</i> : maille de l'analyse à effectuer.</p><p><i>Indicateur</i> : analyse à effectuer.</p><p><i>Rayon minimal/maximal</i> : valeur en pixels des rayons du plus petit et plus grand symbole à afficher.</p><p><i>Code figure</i> : filtrer les analyses pour un certain type de figure. Laisser blanc pour analyser toutes les figures.</p>",
                cls: 'help-box'
            }]
        });
        
        // Setting of min and max possible sizes
        Ext.getCmp('minsize').setMaxValue(50);
        Ext.getCmp('minsize').setMinValue(1);
        Ext.getCmp('maxsize').setMaxValue(50);
        Ext.getCmp('maxsize').setMinValue(1);
        
        // Create a DB view from Rock table and display it on the map as proportional symbols
        function carto_submit() {
            carto_destroy();
            carto.form.submit({
                url: 'stats.php',
                method: 'POST',
                reset: false,
                failure: function(result, action) {
                    alert('Erreur');
                },
                success: addpropSymbols
            });
        }
        
        // Destroy the thematic map
        function carto_destroy() {
            Ext.getCmp('propLegend').setVisible(false);
            if (typeof(popup2) != 'undefined') {
                popup2.destroy();
            }
            // If the layer is already on the map : destroy it
            if (typeof(propSymLyr) != 'undefined') {
                map.removeLayer(propSymLyr);
            }
        }
        
        // Add a layer of proportional circles, based on JSON response
        function addpropSymbols(result, action) {
            var obj = Ext.util.JSON.decode(action.response.responseText);
            var myUrl = "http://127.0.0.1:80/cgi-bin/mapserv.exe?map=C:\\ms4w\\Apache\\htdocs\\" + obj.mapfile + "&";
            var minsize = Ext.getCmp('minsize').getValue();
            var maxsize = Ext.getCmp('maxsize').getValue();
            
            // Create the symbol instance from the max value and the max size
            var symbol = new Geometry('circle', minsize, maxsize, obj.min, obj.max);
            
            // Specify the size of the circles to draw
            var context = {
                getSize: function(feature) {
                    return symbol.getSize(feature.attributes["nb"]);
                }
            };
            
            // Template for styling the proportional circles
            var template = {
                fillOpacity: 0.9,
                strokeColor: "#555555",
                strokeWidth: 1,
                pointRadius: "${getSize}", // using context.getSize(feature)
                fillColor: "#fae318"
            };

            var style = new OpenLayers.Style(template, {context: context});
            var styleMap = new OpenLayers.StyleMap({'default': style, 'select': {fillColor: '#ff6300'}});
            
            // Define the new layer
            propSymLyr = new OpenLayers.Layer.WFS(
                obj.stattype + " par " + obj.scale,
                myUrl,
                {
                    typename: obj.typename
                }, {
                    visibility: true,
                    projection: lambert93,
                    extractAttributes: true,
                    styleMap: styleMap
                }
            );
            map.addLayer(propSymLyr);
            
            propSelect = new OpenLayers.Control.SelectFeature(
                propSymLyr,
                {
                    hover: true,
                    onSelect: createPopupSym,
                    onUnselect: destroyPopupSym
                }
            );
            map.addControl(propSelect);
            propSelect.activate();            
            
            /*
            * Draw the legend images with Canvas
            */
            var canvas = document.getElementById('canvas');
            // delete images from the legend
            canvas.width = canvas.width;
            // get a reference to the canvas
            var ctx = canvas.getContext("2d");
            var xOffset = 20;
            var yOffset = 5;
            var yTextOffset = 20;
            var meanValue = Math.floor( (parseFloat(obj.min) + parseFloat(obj.max)) / 2 );
            var meansize = Math.pow(meanValue, b) * a;
            
            canvas.height = yOffset + 2*maxsize + 2*yTextOffset;
            canvas.width = 4*xOffset + 2*minsize + 2*meansize + 2*maxsize;

            // draw the small circle
            var x0 = xOffset;
            var y0 = 2*maxsize + yOffset - minsize;
            ctx.beginPath();
            ctx.fillStyle = "#fae318";
            ctx.strokeStyle = "#555555";
            ctx.arc(x0, y0, minsize, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // text legend
            ctx.font = "8pt Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(obj.min, x0, y0+yTextOffset);
            
            //draw the mean circle
            var x1 = x0 + minsize + xOffset + meansize;
            var y1 = 2*maxsize + yOffset - meansize;
            ctx.beginPath();
            ctx.fillStyle = "#fae318";
            ctx.arc(x1, y1, meansize, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // text legend
            ctx.fillStyle = "white";
            ctx.fillText(meanValue, x1, y0+yTextOffset);
            
            //draw the large circle
            var x2 = x1 + meansize + xOffset + maxsize;
            var y2 = maxsize + yOffset;
            ctx.beginPath();
            ctx.fillStyle = "#fae318";
            ctx.arc(x2, y2, maxsize, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // text legend
            ctx.fillStyle = "white";
            ctx.fillText(obj.max, x2, y0+yTextOffset);
            
            // change legend title
            document.getElementById('legendtitle').innerHTML = '<h1>' + obj.stattype + '</h1>';
            // display the legend
            Ext.getCmp('propLegend').setVisible(true);
        }
        
        // Popup for values of proportional symbols
        function createPopupSym(feature) {
            popup2 = new GeoExt.Popup({
                location: feature,
                autoWidth: true,
                autoHeight: true,
                html: feature.attributes.nb,
                resizable: false,
                unpinnable: false,
                closable: false,
                border: false,
                map: map,
                feature: feature
            });
            popup2.show();
        };
        
        // Destroy popup
        function destroyPopupSym(feature) {
            popup2.destroy();
        }
        
        // Re-definition of Geometry class : new getSize method
        function Geometry(symbol, minSize, maxSize, minValue, maxValue){
            this.symbol = symbol;
            this.minSize = minSize;
            this.maxSize = maxSize;
            this.minValue = minValue;
            this.maxValue = maxValue;
            
            // Size calculated with Size = a*Value^b
            b = (Math.log(maxSize) - Math.log(minSize)) / (Math.log(maxValue) - Math.log(minValue));
            a = minSize / Math.pow(minValue, b);
            
            this.getSize = function(value){
                if (value == 0) {
                    return 0
                } else {
                    return Math.pow(value, b) * a;
                }
            }

        }
        
        return carto;
    };
    
    /**
    * Method: createLayerPanel
    * Create the layers panel for the main map
    *
    * Returns:
    * Ext.Panel Panel with the whole layers.
    */
    var createLayerPanel = function() {
        var panel = new Ext.Panel({
            title: "Cartes",
            defaults: {
                autoWidth: true,
                autoHeight: true,
                layout: 'fit'
            },
            items : [{
                    title: "Affichage",
                    xtype: "treepanel",
                    loader: new Ext.tree.TreeLoader({
                        applyLoader: false
                    }),
                    root: {
                        nodeType: "gx_layercontainer",
                        layerStore: layerStore,
                        leaf: false,
                        expanded: true
                    },
                    rootVisible: false
                }, {
                    title: 'Légende',
                    collapsible: true,
                    id: 'propLegend',
                    html: '<canvas id="canvas"></canvas><div id="legendtitle"></div>',
                    bodyStyle: 'margin-left: auto; margin-right: auto; text-align: center;',
                    hidden: true
                }]
        });
        
        return panel;
    };

    /**
    * Method: createTbarItems
    * Create map toolbar items
    *
    * Returns:
    * {Array({GeoExt.Action})} An array of GeoExt.Action objects.
    */
    var createTbarItems = function() {
        var actions = [];
        actions.push(new GeoExt.Action({
            iconCls: "pan",
            map: map,
            pressed: true,
            toggleGroup: "tools",
            allowDepress: false,
            tooltip: "Navigate",
            control: new OpenLayers.Control.Navigation()
        }));
        actions.push(new GeoExt.Action({
            iconCls: "zoomin",
            map: map,
            toggleGroup: "tools",
            allowDepress: false,
            tooltip: "Zoom in",
            control: new OpenLayers.Control.ZoomBox({
                out: false
            })
        }));
        var ctrl = new OpenLayers.Control.NavigationHistory();
        map.addControl(ctrl);
        actions.push(new GeoExt.Action({
            control: ctrl.previous,
            iconCls: "back",
            tooltip: "back",
            disabled: true
        }));
        actions.push(new GeoExt.Action({
            control: ctrl.next,
            iconCls: "next",
            tooltip: "next",
            disabled: true
        }));        
        return actions;
    };

    /*
    * Public
    */
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
            var filterform = createFilter();
            var carto = createCarto();
            var layerPanel = createLayerPanel();
            var footer = new Ext.Panel({
                title: 'A propos',
                frame: true,
                defaults: {
                    autoHeight: true,
                    autoWidth: true,
                    layout: 'fit',
                    cls: 'footer',
                    bodyStyle: 'margin: 15px;'
                },
                items: [{
                    title: 'A propos',
                    html: "&copy;Gabriel Vatin - ENSG 2011"                    
                }, {
                    title: 'Documentation',
                    html: "<a href='http://www.google.com'>Guide d'utilisation</a><br/><a href='http://www.ensg.eu'>Documentation technique</a>"
                }]
            });

            // General Viewport of MapFish application
            new Ext.Viewport({
                renderTo: "mapDiv",
                layout: "border",
                items: [{
                    region: 'north',
                    html: '<h1 class="banner-theme x-panel-header">SIG des Merveilles</h1>',
                    autoHeight: true,
                    border: false,
                    margins: '0 0 5 0'
                }, {
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
                    items: [layerPanel, filterform, carto, footer]
                }]
            });
        }
    };
})();
