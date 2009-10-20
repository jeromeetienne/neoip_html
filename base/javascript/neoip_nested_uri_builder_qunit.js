/**
 * All the qunit test for neoip_playlist_t classes
*/
var neoip_nested_uri_builder_qunit	= function(){
	// define the name of the module
	module("tests for neoip_nested_uri_builder_t classes");

	test("build minimal", function(){
		var nested_uri	= new neoip.nested_uri_builder_t()
		nested_uri.outter_uri("http://localhost:4550");
		nested_uri.inner_uri("http://example.com/file.flv?bla=gou");
		var result	= nested_uri.to_string();
		var expected	= "http://localhost:4550/http://example.com/file.flv?bla=gou";
		equals(result, expected, "properly built");		
	});

	test("build with subfile_path", function(){
		var nested_uri	= new neoip.nested_uri_builder_t()
		nested_uri.outter_uri	("http://localhost:4550");
		nested_uri.inner_uri	("http://example.com/file.flv?bla=gou");
		nested_uri.set_var	("subfile_path"	, "/test/file");
		var result	= nested_uri.to_string();
		var expected	= "http://localhost:4550/*subfile_level*2/http://example.com/file.flv/test/file?bla=gou";
		equals(result, expected, "properly built");		
	});

	test("build with mod", function(){
		var nested_uri	= new neoip.nested_uri_builder_t()
		nested_uri.outter_uri	("http://localhost:4550");
		nested_uri.inner_uri	("http://example.com/file.flv?bla=gou");
		nested_uri.set_var	("mod"		, "flv");
		var result	= nested_uri.to_string();
		var expected	= "http://localhost:4550/flv/http://example.com/file.flv?bla=gou";
		equals(result, expected, "properly built");		
	});


	//test("playlist_loader with xdomrpc", function(){
	//	var playlist_loader_cb	= function(notified_obj, userptr, event_type, arg){
	//		console.info("event_type="+event_type);
	//		//console.dir(arg);
	//
	//		QUnit.ok(true, "successfully loaded");
	//		// notify qunit that result is now given and may go to the next test
	//		QUnit.result_given();
	//	}
	//	var cast_name		= "Public Senat"
	//	var cast_privhash	= "e334e91c";
	//	var playlist_uid	= "plistarr_live/"+cast_name +"_"+cast_privhash+".playlist_jspf";
	//	var playlist_loader	= new neoip.playlist_loader_t({
	//		callback:	neoip.playlist_loader_cb_t(playlist_loader_cb),
	//		xdomrpc_url:	"http://api.urfastr.net/CastMdataSrv2/XDOMRPC",
	//		playlist_uid:	playlist_uid
	//	});
	//	// delay qunit until result is known
	//	QUnit.delayed_result();
	//});
}

/*
function testBasic() {
	var nested_uri	= new neoip.nested_uri_builder_t()
	nested_uri.outter_uri("http://localhost:4550");
	nested_uri.inner_uri("http://example.com/file.flv?bla=gou");
	assertEquals("test if equal", nested_uri.to_string()
				, "http://localhost:4550/http://example.com/file.flv?bla=gou");
}
function testSubfilePath() {
	var nested_uri	= new neoip.nested_uri_builder_t()
	nested_uri.outter_uri	("http://localhost:4550");
	nested_uri.inner_uri	("http://example.com/file.flv?bla=gou");
	nested_uri.set_var	("subfile_path"	, "/test/file");
	assertEquals("test if equal", nested_uri.to_string()
				, "http://localhost:4550/*subfile_level*2/http://example.com/file.flv/test/file?bla=gou");
}
function testMod() {
	var nested_uri	= new neoip.nested_uri_builder_t()
	nested_uri.outter_uri	("http://localhost:4550");
	nested_uri.inner_uri	("http://example.com/file.flv?bla=gou");
	nested_uri.set_var	("mod"		, "flv");
	assertEquals("test if equal", nested_uri.to_string()
				, "http://localhost:4550/flv/http://example.com/file.flv?bla=gou");
} 
*/