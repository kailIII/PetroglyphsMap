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
			var filterBool = document.getElementById('checkbox_filter').checked;
			// get the figures from selected rock
			Ext.Ajax.request({
				method: 'POST',
				url: 'getfigures.php',
				params: {
					type: feature.fid[0],
					id: (feature.fid.split('.'))[1],
					filter_on: filterBool  // is filter activated for the list ?
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