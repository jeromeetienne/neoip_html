/*
 * This is a toy to get a jetpack script
 *
 * - this "jetpack.tabs.onReady" function is launched at every page
 *   - this is the main feature of greasemonkey
 *   - it could be used for livatar
*/
jetpack.statusBar.append({
	html: '<img src="http://player.urfastr.net/favicon.ico" style="padding-top: 5px">',
	onReady: function(doc){
		$('img', doc).click(function(){
			jetpack.tabs.open("http://player.urfastr.net/live");
			jetpack.tabs[ Jetpack.tabs.length-1 ].focus();
		});
	},
	width: 20
});
