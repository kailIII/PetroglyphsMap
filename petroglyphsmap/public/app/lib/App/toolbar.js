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