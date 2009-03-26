var neoip_plistarr_qunit	= function(){
	module("plistarr_loader");
	test("plistarr_loader with xdomrpc", function(){
		// same for plistarr
		var plistarr_loader_cb	= function(notified_obj, userptr, event_type, arg){
			console.info("event_type="+event_type);
			console.dir(arg);

			QUnit.ok(true, "successfully loaded");
			// notify qunit that result is now given and may go to the next test
			QUnit.result_given();
		}
		// init the playlist_loader for this playlist_uri
		var plistarr_loader = new neoip.plistarr_loader_t(neoip.plistarr_loader_cb_t(plistarr_loader_cb));
		
		// delay qunit until result is known
		QUnit.delayed_result();
	});	
}