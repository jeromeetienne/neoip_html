/*! \file
    \brief Definition of the neoip.getlocalizer_t

\par Brief Description
This object implement the geolocalisation of the browser using a google service

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor of the object
 *
 * - the callback MUST destroy the object
 * - NOTE: all the script loading is heavily inspired from jquery.ajax (mit license)
 * 
 * @param callback {function} the callback to call on completion with the object
 *                            describing the localisation in google format.
 */
neoip.geolocalizer_t	= function(callback){
	// build the script element
	this.m_scriptEl	= document.createElement("script");
	this.m_scriptEl.src	= "http://www.google.com/jsapi";
	// get the head element
	this.m_headEl	= document.getElementsByTagName("head")[0];

	// Attach handlers for all browsers
	// TODO this is 
	this.m_notified	= false;
	this.m_scriptEl.onload	= this.m_scriptEl.onreadystatechange = function(){
		// NOTE: this magic is from jquery.ajax()
		if ( !this.m_notified && (!this.readyState ||
				this.readyState == "loaded" || this.readyState == "complete") ) {
			// mark the script as loaded
			this.m_notified = true;
			
			// notify the user now
			// - upto the callback to destroy the object
			callback(google.loader.ClientLocation);
		}
	};
	// append the script element to the head one	
	this.m_headEl.appendChild(this.m_scriptEl);
}

/** \brief destructor of the object
 */
neoip.geolocalizer_t.prototype.destructor = function()
{
	if( this.m_scriptEl ){
		// Handle memory leak in IE
		this.m_scriptEl.onload = this.m_scriptEl.onreadystatechange = null;
		// 
		this.m_headEl.removeChild( this.m_scriptEl );		
	}
}
