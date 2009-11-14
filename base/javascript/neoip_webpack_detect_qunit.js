
/*
 * All the qunit test for neoip_playlist_t classes
*/
var neoip_webpack_detect_qunit	= function(){
	// define the name of the module
	module("tests for neoip_webpack_detect_t classes");

	/**
	 * Parameter to get "installed" result (assume webpack is running ofcourse)
	*/
	var webpack_detect_params_installed	= {
					"oload"	: {	"first_port"	: 4550,
							"last_port"	: 4553,
							"min_version"	: "0.0.1",
							"options"	: null
						},
					"casto"	: {	"first_port"	: 4560,
							"last_port"	: 4563,
							"min_version"	: "0.0.1",
							"options"	: null
						},
					"casti"	: {	"first_port"	: 4570,
							"last_port"	: 4573,
							"min_version"	: "0.0.1",
							"options"	: null
						}
				};
	/**
	 * Parameter to get "toupgrade" result
	*/
	var webpack_detect_params_toupgrade	= {
					"oload"	: {	"first_port"	: 4550,
							"last_port"	: 4553,
							"min_version"	: "9.0.1",
							"options"	: null
						},
					"casto"	: {	"first_port"	: 4560,
							"last_port"	: 4563,
							"min_version"	: "9.0.1",
							"options"	: null
						},
					"casti"	: {	"first_port"	: 4570,
							"last_port"	: 4573,
							"min_version"	: "9.0.1",
							"options"	: null
						}
				};
	/**
	 * Parameter to get "toinstall" result
	*/
	var webpack_detect_params_toinstall	= {
					"oload"	: {	"first_port"	: 4550+1000,
							"last_port"	: 4553+1000,
							"min_version"	: "0.0.1",
							"options"	: null
						},
					"casto"	: {	"first_port"	: 4560+1000,
							"last_port"	: 4563+1000,
							"min_version"	: "0.0.1",
							"options"	: null
						},
					"casti"	: {	"first_port"	: 4570+1000,
							"last_port"	: 4573+1000,
							"min_version"	: "0.0.1",
							"options"	: null
						}
				};
	/**
	 * Generic callback for all the tests
	*/
	var webpack_detect_cb	= function(webpack_detect, userptr, result_str){
		// get the expected value from the userptr (specific to unit test) 
		var expected	= userptr.expected;
		var message	= userptr.message;
		// log to debug
		console.info('webpack detect result: '+result_str);
		console.info('userptr='+userptr);
		// destroy the object
		webpack_detect.destructor();

		// give qunit the result
		equals(result_str, expected, "successful");
		// notify qunit that result is now given and may go to the next test
		QUnit.result_given();
	}

	test("Find the installed", function(){
		// start probing neoip-apps
		var cb_fct		= neoip.webpack_detect_cb_t(webpack_detect_cb, window, {
			expected	: "installed",
			message		: "successful"
		});
		var webpack_detect	= new neoip.webpack_detect_t(cb_fct, webpack_detect_params_installed);
		// delay qunit until result is known
		QUnit.delayed_result();
	});
	
	test("Find the toupgrade", function(){
		// start probing neoip-apps
		var cb_fct		= neoip.webpack_detect_cb_t(webpack_detect_cb, window, {
			expected	: "toupgrade",
			message		: "successful"
		});
		var webpack_detect	= new neoip.webpack_detect_t(cb_fct, webpack_detect_params_toupgrade);
		// delay qunit until result is known
		QUnit.delayed_result();
	});
	
	test("Find the toinstall", function(){
		// start probing neoip-apps
		var cb_fct		= neoip.webpack_detect_cb_t(webpack_detect_cb, window, {
			expected	: "toinstall",
			message		: "successful"
		});
		var webpack_detect	= new neoip.webpack_detect_t(cb_fct, webpack_detect_params_toinstall);
		// delay qunit until result is known
		QUnit.delayed_result();
	});

}
