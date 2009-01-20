/*
 * UrFastR Player extjs extension
 *
 * Copyright (c) 2008 Jerome Etienne (urfastr.net)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * - this is a ultra early version made while experimenting with extjs
 */

Ext.ux.UrFastRPlayerWindow = Ext.extend(Ext.Window, {
	title		: '<center><a href="http://urfastr.net/video/player">UrFastsR Player</a></center>',
	layout		: 'fit',
	width		: 320,
	height		: 240,
	closeAction	:'close',
	plain		: true,
	html		: "<iframe src='http://player.urfastr.tv/live?neoip_var_widget_src=extjs_extension' "
				+ "frameborder='no' height='100%' width='100%'></iframe>",
});
