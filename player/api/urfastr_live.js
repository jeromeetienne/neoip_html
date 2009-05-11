/**
 * this object is part of the javascript API for UrFastR Live
 * - opt.container: the html id of the container
*/
var urfastr_live = function(opt){
	// set the default options
	var opt_dfl 	= {
			'width':	"320",
			'height':	"240",
			'neoip_var_arr':{
					'widget_src':		'api_js',
					'onload_start_play':	'disabled'
				}
		};
	var frame_id	= "frame_urfastr_live_" + Math.floor(Math.random()*100000);
	var rpc_client	= null;
	
	var ctor	= function(){
		// in opt, set default if not explicitly set
		for(key in opt_dfl){
			if( opt[key] !== undefined )	continue;
			opt[key]	= opt_dfl[key];
		}
		// init the rpc_client
		if( typeof crossframe === "undefined" )	return;
		rpc_client	= new crossframe.rpc_client_t({
			dest_addr: {
				proxyUrl:	"http://player.urfastr.tv/crossframe_proxy.html",
				//proxyUrl:	"http://localhost/~jerome/neoip_html/lib/crossframe/crossframe_proxy.html",
				listener_obj:	"crossframe_msg",
				iframe_dst:	"frames['"+frame_id+"']"
			},
			resp_addr: {
				proxyUrl:	opt.crossframe_proxyUrl,
				listener_obj:	"crossframe_msg",
				iframe_dst:	"parent"
			}
		});
	}
	
	/**
	 * Build the dom element for UrFastR Player inside opt.container_id
	*/
	var build	= function(){
		var iframe_src	= "http://player.urfastr.tv/live";
		//iframe_src	= "http://localhost/~jerome/neoip_html/bt_cast/casto/neoip_casto_dev.html";

		// convert opt.neoip_var_arr into a list of url variable
		var var_str	= ""
		for(key in opt.neoip_var_arr){
			if( var_str.length )	var_str += "&";
			var_str	+= 'neoip_var_'+ escape(key) + '=' + escape(opt.neoip_var_arr[key]);
		}
		if(var_str.length)	iframe_src	+= '?' + var_str;
		
		// build the body
		var iframeEl	= document.createElement('iframe');
		iframeEl.setAttribute('src'		, iframe_src);
		iframeEl.setAttribute('width'		, opt.width);
		iframeEl.setAttribute('height'		, opt.height);
		iframeEl.setAttribute('frameborder'	, 'no'		);
		iframeEl.setAttribute('frameborder'	, 'no'		);
		iframeEl.setAttribute('id'		, frame_id	);
		iframeEl.setAttribute('name'		, frame_id	);
	
		// append the iframe to the body
		var containerEl	= document.getElementById(opt.container_id);
		containerEl.appendChild(iframeEl);
	}
	
	/**
	 * Start playing 
	*/
	var playing_start	= function(){
		rpc_client.call("playing_start");		
	}
	/**
	 * Stop playing 
	*/
	var playing_stop	= function(){
		rpc_client.call("playing_stop");
	}
	
	// launch the constructor
	ctor();
	// return public functions and variables
	return {
		build:		build,
		playing_start:	playing_start,
		playing_stop:	playing_stop
	};
}