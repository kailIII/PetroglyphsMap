/**
* Method: createCredits
* Create credits panel with docs and infos
*
* Returns:
* Ext.Panel
*/
var createCredits = function() {

	var cred = new Ext.Panel({
		title: '?',
		frame: true,
		defaults: {
			autoHeight: true,
			autoWidth: true,
			layout: 'fit',
			cls: 'creditsPanel',
			bodyStyle: 'margin: 15px;'
		},
		items: [{
			title: 'A propos',
			html: "<p>&copy; LDPL 2011</p><p>AGPL License<a href='http://www.gnu.org/licenses/agpl.html'>(?)</a><br/><img src='http://www.gnu.org/graphics/agplv3-88x31.png'></p><p>Auteur : Gabriel Vatin <a href='mailto:gabriel.vatin@wanadoo.fr'>gabriel.vatin@wanadoo.fr</a></p>"
		}, {
			title: 'Documentation',
			html: "<a href='/doc/UserGuide.pdf'>Guide d'utilisation</a><br/><a href='/doc/DevGuide.pdf'>Documentation technique</a>"
		}, {
			title: 'Administration de la base géographique',
			html: "<a href='/admin'>Index</a>"
		}]
	});
	
	return cred;
};