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