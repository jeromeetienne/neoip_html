/*! \file
    \brief Definition of the oload_redir_t

\par Brief Description
neoip.oload_redir_t is a class to handle the automatic redirection to neoip-oload
- if neoip-oload is present, it is used to build a nested_uri and redirect
  the page toward the nested uri
- if neoip-oload is not present, the page is directly redirect to inner_uri

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
neoip.oload_redir_t	= function()
{
}

/** \brief Destructor
 */
neoip.oload_redir_t.prototype.destructor	= function()
{
	// delete the oload apps_detect_t
	if( this.m_oload_detect ){
		this.m_oload_detect.destructor();
		this.m_oload_detect	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief start the operation
 */
neoip.oload_redir_t.prototype.start = function(inner_uri)
{
	// copy the parameters
	this.m_inner_uri	= inner_uri;
	
	// start probing neoip-apps
	var cb_fct		= neoip.apps_detect_cb_t(this._apps_detect_cb, this);
	this.m_oload_detect	= new neoip.apps_detect_t("oload", 4550, 4559, cb_fct);	
}

/** \brief Callback for all the neoip.apps_detect_t of this page
 */
neoip.oload_redir_t.prototype._apps_detect_cb	= function(apps_detect, userptr, result_str)
{
	// log the result
	console.info("enter suffix_name=" + apps_detect.suffix_name() + " result_str=" + result_str);

	// delete the apps_detect
	this.m_oload_detect.destructor();
	this.m_oload_detect	= null;

	// determine the final_uri depending on the result_str
	if( result_str != "found" ){
		window.location	= this.m_inner_uri;
		// never executed - as it jump immediatly to the inner_uri page
		return;
	}

	// build the nested_uri
	// - httpo_content_attach = true is needed to force the browser to download the file 
	//   and not try to display it
	var nested_uri	= new neoip.nested_uri_builder_t();
	nested_uri.outter_uri	(neoip.outter_uri("oload"));
	nested_uri.inner_uri	(this.m_inner_uri);
	nested_uri.set_var	("httpo_content_attach", "true");
	var final_uri	= nested_uri.to_string();
	

	// log to debug
	console.info("redirect to " + final_uri);

	// appends a iframe to the page in order to trigger the download 
	var iframe_elem	= document.createElement('iframe');
	iframe_elem.setAttribute('height'	, "0");
	iframe_elem.setAttribute('width'	, "0");
	iframe_elem.setAttribute('src'		, final_uri);
	document.body.appendChild(iframe_elem);
}

