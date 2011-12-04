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