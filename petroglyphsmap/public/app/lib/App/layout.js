
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
    
    var map, center, zone_lyr, rock_lyr, layerStore, propSym_popup, gridWin, pieWin, styleMap_rock, styleMap_rock_label;
    var propSymLyr = null;
    var popup = null;
    var phpsession = document.cookie.substring(10, document.cookie.length-1);    
    var myWFS = MSurl + mappath + 'wfs.map&'; // original WFS url
    
    // Projection variables
    var epsg4326 = new OpenLayers.Projection("EPSG:4326");
    var lambert93 = new OpenLayers.Projection("EPSG:2154");
    var proj_geop = new OpenLayers.Projection("IGNF:GEOPORTALFXX");
    
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
        
        // Rocks default stylemp
        styleMap_rock = new OpenLayers.StyleMap({
            pointRadius: 4,
            fillColor: "blue",
            fillOpacity: 0.4,
            strokeWidth: 0.5,
            strokeColor: "blue"
        });
        
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
        // OpenLayers navigation control
        var navControl = new OpenLayers.Control.Navigation({
            type: OpenLayers.Control.TYPE_TOGGLE,
            zoomWheelEnabled: true
        });
        map.addControl(navControl);
        navControl.activate();
        
        // Create select feature control for features on Zones and Rocks
        var selectControl = new OpenLayers.Control.SelectFeature(
            [zone_lyr, rock_lyr],
            {
                onSelect: createPopup,
                onUnselect: function(feature) {popup.destroy()}
            }
        );
        map.addControl(selectControl);
        selectControl.activate();
        
        // Define function to change the values of a given field in a JSON object
        function replaceByValue(json, field, oldvalue, newvalue) {
            for( var k = 0; k < json.length; ++k ) {
                if( oldvalue == json[k][field] ) {
                    json[k][field] = newvalue ;
                }
            }
        }
        
        //
        // Popup definition
        //
        
        // Define "createPopup" function
        function createPopup(feature) {
            var popup_title, popup_html, winTitle, picwin;
            var z = feature.attributes.zone_number;
            var g = feature.attributes.group_number;
            var r = feature.attributes.rock_number;
            var pic_path = weburl + 'photos/Z' + z + '/G' + g + '/R' + r + '.jpg';
            
            // Description of the feature, according to its type
            if (feature.fid[0]=='z') {  // Zone description
                popup_title = "Zone";
                popup_html = "Zone "  + z + '<br/>'
                    + "<span id='listLink' class='link'>Tableau des figures</span><br/>"
                    + "<span id='pieLink' class='link'>Types des figures</span>";
                winTitle = 'Figures - Zone ' + z;
            } else if (feature.fid[0]=='r') {   // Rock description
                popup_title = "Roche";
                popup_html = "Zone " + z + '<br/>'
                    + "Groupe " + g + '<br/>'
                    + "Roche " + r + '<br/>'
                    + "X : " + feature.attributes.point_x + '<br/>'
                    + "Y : " + feature.attributes.point_y + '<br/>'
                    + "Z : " + feature.attributes.point_z + '<br/>'
                    + "Année de lever : " + feature.attributes.year + '<br/>'
                    + "<span id='listLink' class='link'>Tableau des figures</span><br/>"
                    + "<span id='pieLink' class='link'>Types des figures</span><br/>"
                    + "<span id='pictureSpan' class='link'><a href='" + pic_path + "'>Plan de roche</a></span>";
                winTitle = 'Figures - Roche ' + feature.attributes.rock_number;
            }
            
            // Popup object
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
            
            // Rock tooltip, to show image in the popup
            var tt = new Ext.ToolTip({
                target: 'pictureSpan',
                html: "<img src='" + pic_path + "' width=400 />",
                autoHeight: true,
                width: 400
            });
            
            //
            // Grid definition
            //
            
            // Figure tooltip, to show image in the figures grid
            function addTooltip(value, metadata, record, rowIndex, colIndex, store){
                metadata.attr = 'ext:qtip="<img src='+"'"+value+"'"+' height=400 />"';
                return value;
            }
            
            // Create the grid containing the whole figures description
            function createGrid(result, request) {
                var jsonData = Ext.util.JSON.decode(result.responseText);   // get the response from database
                // Fields list
                var featFields = [
                    {name: 'face', type: 'string'},
                    {name: 'figure_number', type: 'string'},
                    {name: 'identity', type: 'string'},
                    {name: 'alternative_identity', type: 'string'},
                    {name: 'image', type: 'string'}
                ];
                
                // If feature is a zone, adding two fields to default fields
                if (feature.fid[0] == 'z') {
                    featFields.splice(0, 0, {name: 'group_number', type: 'integer'});
                    featFields.splice(1, 0, {name: 'rock_number', type: 'string'});
                }
                
                if (jsonData[0] == null) {
                    alert("Aucune figure n'a été référencée."); // no listed figures, so no grid to do
                } else {
                    var store = new Ext.data.JsonStore ({
                        autoDestroy: true,
                        storeId: 'store',
                        idIndex: 0,
                        fields: featFields,
                        data: jsonData
                    });
                    
                    // Columns list
                    var col = [{
                            header: 'Face',
                            sortable: true, 
                            dataIndex: 'face',
                            width: 50
                        }, {
                            header: 'Figure',
                            sortable: true,
                            dataIndex: 'figure_number',
                            width: 70
                        }, {
                            header: 'Code',
                            sortable: true, 
                            dataIndex: 'identity',
                            width: 150
                        }, {
                            header: 'Code alternatif',
                            sortable: true,
                            dataIndex: 'alternative_identity',
                            width: 150
                        }, {
                            header: 'Image',
                            sortable: false,
                            dataIndex: 'image',
                            width: 150,
                            renderer: addTooltip    // to show images whe mouse is over the cell
                    }];
                    
                    // If feature is a zone, adding two columns to default columns
                    if (feature.fid[0] == 'z') {
                        col.splice(0, 0, {header: 'Groupe', sortable: true, dataIndex: 'group_number', width: 70});
                        col.splice(1, 0, {header: 'Roche', sortable: true, dataIndex: 'rock_number', width: 60});
                    }
                    
                    var grid = new Ext.grid.GridPanel ({
                        store: store,
                        stateId: 'stateGrid',
                        columns: col,
                        boxMaxHeight: 400,
                        viewConfig: {
                            stripeRows: true
                        }
                    });
                    
                    // Replace any existing grid window
                    if (typeof(gridWin) != "undefined") {
                        gridWin.destroy();
                    }
                    
                    // display the grid in a window
                    gridWin = new Ext.Window ({
                        title: winTitle,
                        autoWidth: true,
                        height: 400,
                        autoScroll: true,
                        layout: 'fit',
                        x: 50,
                        y: 150,
                        items: grid,
                        shadow: true
                    });                    
                    gridWin.show();
                }
            }
            
            function createPie(result, request) {
                var jsonData = Ext.util.JSON.decode(result.responseText);
                if (jsonData[0] == null) {
                    alert("Aucune figure n'a été référencée.");
                } else {                    
                    // replace all the letters by real names
                    replaceByValue(jsonData, 'type', 'C', 'Corniformes');
                    replaceByValue(jsonData, 'type', 'P', 'Poignards');
                    replaceByValue(jsonData, 'type', 'F', 'Hallebardes');
                    replaceByValue(jsonData, 'type', 'T', 'Attelages');
                    replaceByValue(jsonData, 'type', 'H', 'Anthropomorphes');
                    replaceByValue(jsonData, 'type', 'R', 'Figures géométriques');
                    replaceByValue(jsonData, 'type', 'N', 'Non représentatives');
                    replaceByValue(jsonData, 'type', '', 'Pas description');
                    replaceByValue(jsonData, 'type', 'A', 'Anthropomorphes simples');
                    
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
                        height: 400,
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
                    
                    if (typeof(pieWin) != "undefined") {
                        pieWin.destroy();
                    }
                    
                    // display the pie in a window
                    pieWin = new Ext.Window ({
                        title: winTitle,
                        width: 400,
                        autoHeight: true,
                        layout: 'fit',
                        items: piePanel,
                        shadow: true
                    });                    
                    pieWin.show();
                }
            }
            
            // Send query to the DB for creating pie
            function postPie() {
                // get the figures from selected rock
                Ext.Ajax.request({
                    method: 'POST',
                    url: 'pies.php',
                    params: {
                        type: feature.fid[0],
                        id: (feature.fid.split('.'))[1]
                    },
                    success: createPie
                });
            }
            
            // Send query to the DB for creating list
            function postList() {
                var bool = document.getElementById('checkbox_filter').checked;
                // get the figures from selected rock
                Ext.Ajax.request({
                    method: 'POST',
                    url: 'getfigures.php',
                    params: {
                        type: feature.fid[0],
                        id: (feature.fid.split('.'))[1],
                        checkbox: bool  // is filter activated for the list ?
                    },
                    success: createGrid
                });
            }
            
            // Display the window when link is clicked
            document.getElementById('listLink').onclick = postList;            
            document.getElementById('pieLink').onclick = postPie;
            
        }
        
        // Loading window while data are loading to the map
        var loadingWin = new Ext.Window ({
            autoWidth: true,
            autoHeight: true,
            layout: 'fit',
            shadow: true,
            items: {
                autoWidth: true,
                autoHeight: true,
                html: '<img src="img/loading.gif" /><p>Chargement des données</p>',
                bodyStyle: 'margin-left: auto; margin-right: auto; text-align: center;'
            },
            hidden: true,
            closable: false
        });
        
        // add this window for rocks layer only
        rock_lyr.events.register('loadstart', loadingWin, function(){loadingWin.show()});
        rock_lyr.events.register('loadend', loadingWin, function(){loadingWin.hide()});
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
                    width: 110
                }, {
                    xtype: 'combo',
                    id: 'zonecombo',
                    name: 'zonecombo',
                    width: 110,
                    fieldLabel: 'Zone(s)',
                    typeAhead: true,
                    editable: false,
                    triggerAction: 'all',
                    mode: 'local',
                    value: 999,
                    store: new Ext.data.ArrayStore({
                        id: 'zonestore',
                        autoLoad: false,
                        pruneModifiedRecords: true,
                        fields: [
                            'zoneTxt',
                            'zoneNumber'
                        ],
                        data: [['Tout', 999],
                            ['0', 0],
                            ['1', 1],
                            ['2', 2],
                            ['3', 3],
                            ['4', 4],
                            ['5', 5],
                            ['6', 6],
                            ['7', 7],
                            ['8', 8], 
                            ['9', 9],
                            ['10', 10],
                            ['11', 11],
                            ['12', 12],
                            ['13', 13],
                            ['14', 14],
                            ['15', 15],
                            ['16', 16],
                            ['17', 17],
                            ['18', 18], 
                            ['19', 19],
                            ['20', 20],
                            ['21', 21],
                            ['22', 22],
                            ['23', 23]]
                    }),
                    valueField: 'zoneNumber',
                    displayField: 'zoneTxt',
                    allowBlank: false
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
                html: '<p><i>Code figure</i> : code des figures à afficher. Le caractère <i>*</i> représente tout texte.<br/>Ex : <i>c2*</i> pour rechercher les corniformes avec corps (tout code commençant par "C2").</p><p><i>Zone</i> : numéro de la (les) zone(s) à afficher.</p><p><i>Filtrer la description des roches</i> : la fiche descriptive des roches, activée par un clic, ne prendra en compte que les roches filtrées.</p>',
                cls: 'help-box'
            }]
        });
        
        function displayFilter(result, action) {
            var filtertxt = document.getElementById('identitystring').value;
            var zonetxt = document.getElementById('zonecombo').value;
            if (filtertxt != '' && zonetxt != 'Tout') {
                var filterstring = filtertxt + ' & Z' + zonetxt;
            } else if (filtertxt != '') {
                var filterstring = filtertxt;
            } else {
                var filterstring = 'Z' + zonetxt;
            }
            
            var obj = Ext.util.JSON.decode(action.response.responseText); // response object with the mapfile path for WFS
            rock_lyr.url = MSurl + mappath + obj.mapfile.replace('/', '\\') + "&";
			console.log(mappath + ' ' + obj.mapfile);
            rock_lyr.setVisibility(true); // display the map
            document.getElementById('formstatus').innerHTML = 'Filtre activé'; // status update
            document.getElementById('formstatus').className = 'filter-on';
            document.getElementById('rockstatus').innerHTML = '<img src="img/filter.png" alt="' + filterstring + '" title="' + filterstring + '"/>';
        }
        
        // Function to create a DB view from Rock table and display it on the map
        function filterform_submit() {
            if (popup != null) {
                popup.destroy();
            }
            rock_lyr.setVisibility(false); // hide the map
            
            filterform.form.submit({
                url: 'rockview.php',
                method: 'POST',
                params: {
                    log: phpsession
                },
                reset: false,
                failure: function(result, action) {
                    alert('Erreur : vérifier les champs...');
                },
                success: displayFilter
            });
        }
        
        // Function to delete all filters
        function filterform_destroy() {
            if (popup != null) {
                popup.destroy();
            }
            rock_lyr.setVisibility(false); // hide the map
            rock_lyr.url = myWFS; // back to default WFS (no filter)
            document.getElementById('formstatus').innerHTML = 'Filtre désactivé'; // status update
            document.getElementById('formstatus').className = 'x-panel';
            document.getElementById('rockstatus').innerHTML = '';
            document.getElementById('identitystring').value = null;

            // delete the created view from the DB and the temporary mapfile
            Ext.Ajax.request({
                method: 'POST',
                url: 'reinit_rockview.php'
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
                    id: 'filterstring',
                    name: 'filterstring',
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
                params: {
                    log: phpsession
                },
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
            if (typeof(propSym_popup) != 'undefined') {
                propSym_popup.destroy();
            }
            // If the layer is already on the map : destroy it
            if (propSymLyr != null) {
                map.removeLayer(propSymLyr);
                propSymLyr = null;
            }
            
            // delete the created view from the DB and the temporary mapfile
            Ext.Ajax.request({
                method: 'POST',
                url: 'reinit_stats.php'
            });
        }
        
        // Add a layer of proportional circles, based on JSON response
        function addpropSymbols(result, action) {
            var obj = Ext.util.JSON.decode(action.response.responseText);
            var myUrl = MSurl + mappath + obj.mapfile + "&";
            var minsize = Ext.getCmp('minsize').getValue();
            var maxsize = Ext.getCmp('maxsize').getValue();
            
            // Create the symbol instance from the max value and the max size
            var symbol = new Geometry('circle', minsize, maxsize, obj.min, obj.max);
            
            // Specify the size of the circles to draw
            var context_circle = {
                getSize: function(feature) {
                    return symbol.getSize(feature.attributes["nb"]);
                }
            };
            
            // Template for styling the proportional circles
            var template_circle = {
                fillOpacity: 0.9,
                strokeColor: "#555555",
                strokeWidth: 1,
                pointRadius: "${getSize}", // using context.getSize(feature)
                fillColor: "#fae318"
            };

            var style_circle = new OpenLayers.Style(template_circle, {context: context_circle});
            var styleMap_circle = new OpenLayers.StyleMap({'default': style_circle, 'select': {fillColor: '#ff6300'}});
            
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
                    styleMap: styleMap_circle
                }
            );
            map.addLayer(propSymLyr);
            
            propSelect = new OpenLayers.Control.SelectFeature(
                propSymLyr,
                {
                    hover: true,
                    onSelect: createPopupSym,
                    onUnselect: function(feature) {propSym_popup.destroy()}
                }
            );
            map.addControl(propSelect);
            propSelect.activate();            
            
            //
            // Draw the legend images with Canvas
            //
            var canvas = document.getElementById('canvas'); // delete images from the legend
            canvas.width = canvas.width; // get a reference to the canvas
            
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
            propSym_popup = new GeoExt.Popup({
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
            propSym_popup.show();
        };
        
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
    
        // Export visible rocks to KML        
        function exportKml() {
            if (rock_lyr.visibility == false) {
                alert("Aucune roche n'est affichée...");
            } else {
                var l = rock_lyr.clone();
                var f = l.features;
                var kmlwriter = new OpenLayers.Format.KML();
                var kmlobj = write_2(kmlwriter, f);                
                var kmlstring = new XMLSerializer().serializeToString(kmlobj);
                l.destroy();
                
                var kmlwin = new Ext.Window({
                    title: 'Fichier KML',
                    width: 450,
                    height: 450,
                    autoScroll: true,
                    layout: 'fit',
                    shadow: true,
                    items: [{
                        xtype: 'textarea',
                        id: 'kmlstring',
                        value: kmlstring,
                        readOnly: true,
                        width: 400,
                        height: 400
                    }]
                });
                kmlwin.show();
            }
        }
        
        // Give the WFS url for visible rocks, for desktop GIS use
        function exportGis() {
            if (rock_lyr.visibility == false) {
                alert("Aucune roche n'est affichée...");
            } else {
                var giswin = new Ext.Window({
                    title: 'Adresse WFS',
                    width: 300,
                    height: 150,
                    layout: 'fit',
                    shadow: true,
                    items: [{
                        xtype: 'textarea',
                        id: 'wfsstring',
                        value: 'URL du WFS :\n' + rock_lyr.url,
                        readOnly: true
                    }]
                });
                giswin.show();
            }
        }
        
        // New definition of OpenLayers.Format.KML.write() function
        function write_2(kmlfile, features) {
            
            var kml = document.createElementNS("http://earth.google.com/kml/2.2", "kml");
            var doc = kmlfile.createElementNS('', 'Document');
            var folder = kmlfile.createElementNS('', 'Folder');
            var folderName = kmlfile.createElementNS('', 'name');
            folderName.appendChild(kmlfile.createTextNode('Roches'));
            folder.appendChild(folderName);
            
            for (var i=0; i < features.length; i++) {
                features[i].geometry.transform(proj_geop, epsg4326);
                folder.appendChild(createPlacemarkXML_2(kmlfile, features[i]));
            }
            
            doc.appendChild(folder);
            kml.appendChild(doc);
            
            return kml;
        }
        
        // New definition of OpenLayers.Format.XML.createPlacemarkXML() function
        function createPlacemarkXML_2(kmlfile, feature) {            
            // Style
            var placemarkStyle = kmlfile.createElementNS('', "styleUrl");
            placemarkStyle.appendChild(kmlfile.createTextNode(weburl + 'style.kml#rockstyle'));
            
            // Placemark name
            var placemarkName = kmlfile.createElementNS('', "name");
            var name = 'Z' + feature.attributes.zone_number + 'G' + feature.attributes.group_number + 'R' + feature.attributes.rock_number;
            placemarkName.appendChild(kmlfile.createTextNode(name));

            // Placemark description
            var placemarkDesc = kmlfile.createElementNS('', "description");
            var desc = 'Zone: ' + feature.attributes.zone_number + '<br/>Groupe: ' + feature.attributes.group_number + '<br/>Roche: ' + feature.attributes.rock_number+ '<br/>X: ' + feature.attributes.point_x + '<br/>Y: ' + feature.attributes.point_y + '<br/>Z: ' + feature.attributes.point_z + '<br/>Lever: ' + feature.attributes.yaer;
            placemarkDesc.appendChild(kmlfile.createTextNode(desc));

            // Placemark
            var placemarkNode = kmlfile.createElementNS('', "Placemark");
            if(feature.fid != null) {
            placemarkNode.setAttribute("id", feature.fid);
            }
            placemarkNode.appendChild(placemarkStyle);
            placemarkNode.appendChild(placemarkName);
            placemarkNode.appendChild(placemarkDesc);

            // Geometry node (Point, LineString, etc. nodes)
            var geometryNode = kmlfile.buildGeometryNode(feature.geometry);
            placemarkNode.appendChild(geometryNode);

            // TBD - deal with remaining (non name/description) attributes.
            return placemarkNode;
        }
    
        var panel = new Ext.Panel({
            title: "Navigation",
            defaults: {
                autoWidth: true,
                autoHeight: true,
                layout: 'fit'
            },
            items : [{
                    title: 'Affichage',
                    xtype: 'treepanel',
                    loader: new Ext.tree.TreeLoader({
                        applyLoader: false
                    }),
                    root: {
                        nodeType: 'gx_layercontainer',
                        layerStore: layerStore,
                        leaf: false,
                        expanded: true
                    },
                    rootVisible: false
                }, {
                    title: 'Options',
                    xtype: 'form',
                    defaults: {
                        autoWidth: true,
                        autoHeight: true,
                        layout: 'form'
                    },
                    frame: true,
                    items: [{
                        xtype: 'checkbox',
                        boxLabel: 'Filtrer la description des roches',
                        checked: false,
                        id: 'checkbox_filter',
                        name: 'checkbox_filter',
                        value: 'checkbox',
                        hideLabel: true
                    }, {
                        xtype: 'checkbox',
                        boxLabel: 'Afficher le numéro des roches',
                        checked: false,
                        id: 'checkbox_label',
                        name: 'checkbox_label',
                        value: 'checkbox',
                        hideLabel: true,
                        handler: function(checkbox, checked) {
                            if (checked) {
                                rock_lyr.styleMap = styleMap_rock_label;
                                rock_lyr.redraw();
                            } else {
                                rock_lyr.styleMap = styleMap_rock;
                                rock_lyr.redraw();
                            }
                        }
                    }, {
                        title: 'exportKml',
                        xtype: 'button',
                        id: 'exportKml',
                        text: 'Exporter les roches en KML',
                        handler: exportKml
                    }, {
                        title: 'exportGis',
                        xtype: 'button',
                        id: 'exportGis',
                        text: 'Visualiser sous logiciel SIG',
                        handler: exportGis
                    }]
                }, {
                    title: 'Légende',
                    collapsible: true,
                    id: 'propLegend',
                    html: '<canvas id="canvas"></canvas><div id="legendtitle"></div>',
                    bodyStyle: 'margin-left: auto; margin-right: auto; text-align: center;',
                    hidden: true
                }, {
                    title: 'Aide',
                    collapsible: true,
                    collapsed: true,
                    frame: true,
                    html: "<p><i>Roches / Zones</i> : données vecteur à afficher.</p><p><i>Cartes IGN / Ortho IGN</i> : fond de carte.</p><p><i>Filtrer la description des roches</i> : dans la liste des figures des zones ou roches, n'afficher que les figures correspondant au filtre appliqué.</p><p><i>Afficher le numéro des roches</i> : activer les labels sur les roches.</p><p><i>Exporter les roches en KML</i> : créer un fichier pour Google Earth, avec toutes les roches affichées sur la carte.</p>",
                    cls: 'help-box'
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
                title: '?',
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
                    html: "<p>&copy;Gabriel Vatin - LDPL</p><p>AGPL <a href='http://www.gnu.org/licenses/agpl.html'>(?)</a></p>"
                }, {
                    title: 'Documentation',
                    html: "<a href='/doc/UserGuide.pdf'>Guide d'utilisation</a><br/><a href='/doc/DevGuide.pdf'>Documentation technique</a>"
                }, {
                    title: 'Administration de la base géographique',
                    html: "<a href='/admin'>Index</a>"
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
