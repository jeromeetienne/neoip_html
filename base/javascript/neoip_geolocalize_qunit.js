/**
 * All the qunit test for neoip_geolocalize function
*/
var neoip_geolocalize_qunit	= function(){
	// define the name of the module
	module("tests for neoip_geolocalize function");

	test("get current localisation", function(){
		neoip.geoLocalize(function(clientLocalisation){
			// log to debug
			console.info('client localisation is:');
			console.dir(clientLocalisation);
			// give qunit the result
			QUnit.ok(true, "successfully loaded");
			// notify qunit that result is now given and may go to the next test
			QUnit.result_given();
		})
		var playlist_loader_cb	= function(notified_obj, userptr, event_type, arg){
			console.info("event_type="+event_type);
			//console.dir(arg);

		}
		// delay qunit until result is known
		QUnit.delayed_result();
	});
}