/**
 * All the qunit test for neoip_playlist_t classes
*/
var neoip_nested_uri_builder_qunit	= function(){
	// define the name of the module
	module("tests for neoip_nested_uri_builder_t classes");

	// one test
	test("build minimal", function(){
		var nested_uri	= new neoip.nested_uri_builder_t()
		nested_uri.outter_uri("http://localhost:4550");
		nested_uri.inner_uri("http://example.com/file.flv?bla=gou");
		var result	= nested_uri.to_string();
		var expected	= "http://localhost:4550/http://example.com/file.flv?bla=gou";
		equals(result, expected, "properly built");		
	});

	// one test
	test("build with subfile_path", function(){
		var nested_uri	= new neoip.nested_uri_builder_t()
		nested_uri.outter_uri	("http://localhost:4550");
		nested_uri.inner_uri	("http://example.com/file.flv?bla=gou");
		nested_uri.set_var	("subfile_path"	, "/test/file");
		var result	= nested_uri.to_string();
		var expected	= "http://localhost:4550/*subfile_level*2/http://example.com/file.flv/test/file?bla=gou";
		equals(result, expected, "properly built");		
	});

	// one test
	test("build with mod", function(){
		var nested_uri	= new neoip.nested_uri_builder_t()
		nested_uri.outter_uri	("http://localhost:4550");
		nested_uri.inner_uri	("http://example.com/file.flv?bla=gou");
		nested_uri.set_var	("mod"		, "flv");
		var result	= nested_uri.to_string();
		var expected	= "http://localhost:4550/flv/http://example.com/file.flv?bla=gou";
		equals(result, expected, "properly built");		
	});
}
