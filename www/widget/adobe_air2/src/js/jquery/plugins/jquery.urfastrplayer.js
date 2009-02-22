/*
 * UrFastR Player jquery plugin
 *
 * Copyright (c) 2008 Jerome Etienne (urfastr.net)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * - this is a ultra early version made while experimenting with jquery
 */

jQuery.fn.UrFastR_Player = function(options) {
	var settings = jQuery.extend({
		width: 	320,
		height:	240
	}, options);
	iframeEl	= document.createElement('iframe');
	iframeEl.setAttribute('src'		, 'http://player.urfastr.tv/live?neoip_var_widget_src=jquery_plugin');
	iframeEl.setAttribute('width'		, settings.width);
	iframeEl.setAttribute('height'		, settings.height);
	iframeEl.setAttribute('frameborder'	, 'no');	
	return this.empty().append(iframeEl);
};