/**
 * All the qunit test for neoip_playlist_t classes
*/
var neoip_plistarr_qunit	= function(){
	// define the name of the module
	module("tests for neoip_plistarr_t classes");

	test("plistarr_loader with xdomrpc", function(){
		// same for plistarr
		var plistarr_loader_cb	= function(notified_obj, userptr, event_type, arg){
			console.info("event_type="+event_type);
			console.dir(arg);

			QUnit.ok(true, "successfully loaded");
			// notify qunit that result is now given and may go to the next test
			QUnit.result_given();
		}
		// init the plistarr_loader
		var plistarr_loader = new neoip.plistarr_loader_t({
			callback:	neoip.plistarr_loader_cb_t(plistarr_loader_cb),
			xdomrpc_url:	"../../cgi-bin/xdomrpc_dispatcher.php",
			plistarr_uid:	'plistarr_live'
		});
		
		// delay qunit until result is known
		QUnit.delayed_result();
	});	
}