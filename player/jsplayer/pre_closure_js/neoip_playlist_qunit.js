/**
 * All the qunit test for neoip_playlist_t classes
*/
var neoip_playlist_qunit	= function(){
	// define the name of the module
	module("tests for neoip_playlist_t classes");

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
		var playlist_uid	= "plistarr_live/"+cast_name +"_"+cast_privhash+".playlist_jspf";
		var playlist_loader	= new neoip.playlist_loader_t({
			callback:	neoip.playlist_loader_cb_t(playlist_loader_cb),
			xdomrpc_url:	"http://api.urfastr.net/CastMdataSrv2/XDOMRPC",
			playlist_uid:	playlist_uid
		});
		// delay qunit until result is known
		QUnit.delayed_result();
	});
}