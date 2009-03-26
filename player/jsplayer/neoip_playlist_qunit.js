var neoip_playlist_qunit	= function(){
	module("playlist_loader");
	test("playlist_loader with xdomrpc", function(){
		var playlist_loader_cb	= function(notified_obj, userptr, event_type, arg){
			console.info("event_type="+event_type);
			//console.dir(arg);

			QUnit.ok(true, "successfully loaded");
			// notify qunit that result is now given and may go to the next test
			QUnit.result_given();
		}
		var cast_name		= "Public Senat"
		var cast_privhash	= "e334e91c";
		var playlist_url	= "../../cgi-bin/cast_get_playlist.fcgi?basename="+ cast_name +"_"+cast_privhash+".playlist_jspf";	
		playlist_url	= "xdomrpc:"+ cast_name +"_"+cast_privhash+".playlist_jspf";
		// init the playlist_loader for this playlist_uri
		var playlist_loader = new neoip.playlist_loader_t(playlist_url, neoip.playlist_loader_cb_t(playlist_loader_cb));
		
		// delay qunit until result is known
		QUnit.delayed_result();
	});
}