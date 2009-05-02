/**
 * All the qunit test for neoip_geolocalize function
*/
var neoip_geolocalizer_qunit	= function(){
	// define the name of the module
	module("tests for neoip.geolocalizer_t class");

	test("get current location", function(){
		var geolocalizer= null;
		var callback	= function(clientLocation){
			// log to debug
			console.info('client localisation is:');
			console.dir(clientLocation);
			// destroy the object
			geolocalizer.destructor();
			// give qunit the result
			QUnit.ok(true, "successfully loaded");
			// notify qunit that result is now given and may go to the next test
			QUnit.result_given();
		}
		// init the object
		geolocalizer	= new neoip.geolocalizer_t(callback);
		// delay qunit until result is known
		QUnit.delayed_result();
	});
}