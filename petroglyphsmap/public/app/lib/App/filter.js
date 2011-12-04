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