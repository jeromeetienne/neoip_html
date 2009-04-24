// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};


/**
 * get the geolocalisation of the client
 * - it is using google geolocalisation in jsapi http://code.google.com/apis/ajaxlibs/
 * - NOTE: all the script loading is heavily inspired from jquery.ajax (mit license)
 * 
 * @param callback {function} the callback to call on completion
 * @returns {object}	the object describing the localisation
*/
neoip.geoLocalize	= function(callback){

	// build the script element
	var script	= document.createElement("script");
	script.src	= "http://www.google.com/jsapi";
	// get the head element
	var head	= document.getElementsByTagName("head")[0];


	// Attach handlers for all browsers
	var done = false;
	script.onload = script.onreadystatechange = function(){
		if ( !done && (!this.readyState ||
				this.readyState == "loaded" || this.readyState == "complete") ) {
			// mark the script as loadded
			done = true;
			
			// notify the user now
			callback(google.loader.ClientLocation);
			
			// Handle memory leak in IE
			script.onload = script.onreadystatechange = null;
			head.removeChild( script );
		}
	};
	// append the script element to the head one	
	head.appendChild(script);
}
