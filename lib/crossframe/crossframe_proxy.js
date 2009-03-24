(function() {
	/**
	 * Determine if obj hasOwnProperty prop
	 * - This function is copied from yahoo.js.
	 * - This keeps this file free of dependencies.
	*/
	function hasOwnProperty(obj, prop){
		if (Object.prototype.hasOwnProperty) {
			return obj.hasOwnProperty(prop);
		}
		return typeof obj[prop] !== "undefined" &&
			obj.constructor.prototype[prop] !== obj[prop];
	}

	/**
	 * Parse the query string
	*/
	function parseQueryString(str) {
		var result	= {};
		var keyvals	= str.split('&');
		// log to debug
		//console.info('str='+str);
		//console.dir(keyvals);
		// go thru all the keyvals
		for(var i = 0; i < keyvals.length; i++) {
			// TODO there is an issue if the parameter has a = in the value
			// - limit the number of result
			var keyval	= keyvals[i].split('=', 2);
			if( keyval.length === 2 && keyval[0].length > 0) {
				result[keyval[0]] = unescape(keyval[1]);
			}
		}
		return result;
	}

	obj	= parseQueryString(location.hash.substr(1));
	//console.info('o hash='+location.hash);
	//console.dir(obj);
	// The following properties may be missing as a result of preloading
	// this file for example. Simply do nothing in that case...
	if( hasOwnProperty(obj, "iframe_dst")		&&
			hasOwnProperty(obj, "message")	&&
			hasOwnProperty(obj, "domain")	&&
			hasOwnProperty(obj, "uri")	&&
			hasOwnProperty(obj, "listener_obj")
			){
		
		// Match things like parent.frames["aaa"].top.frames[0].frames['bbb']
		regexp	= /^(?:(?:(top|parent|frames\[(?:(?:['"][a-zA-Z\d-_]*['"])|\d+)\]))(?:\.|$))+/;
		if( !regexp.test(obj.iframe_dst) )
			throw new Error("Invalid iframe_dst: " + obj.iframe_dst);

		// Safe to eval as it has been checked by the regexp
		// - prepend a 'parent.' as this js script is in a iframe inside the sender
		//   and iframe_dst is expressed from the sender point of view
		var frame_str	= "parent." + obj.iframe_dst;
		//console.info("frame_str="+frame_str);
		var frame_dst	= eval(frame_str);
		
		// log to debug
		//console.dir(frame_dst);
		//console.info("proxying from " + parent.location.href);
		//console.info("proxying to " + frame_dst.location.href);
		//console.info('iframe_dst='+ "parent." + obj.iframe_dst);
		//console.info('message='+ obj.message);

		// Let the application know a message has been received.
		// - assume a global crossframe_msg variable exist in the destination frame
		frame_dst[obj.listener_obj].event.trigger(obj.message, obj.domain, obj.uri);
	}
})();
