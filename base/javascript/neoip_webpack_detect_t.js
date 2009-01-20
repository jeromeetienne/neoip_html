/*! \file
    \brief Definition of the neoip.webpack_detect_t

\par Brief Description
This object implements the detection of neoip-webpack. It is mainly used
to display the neoip-webpack badge on webpages.

\par About state automata
- assumed initial state = "inprobing"
- start the neoip.apps_detect_t probing of each neoip-apps inside neoip-webpack
- once they are all completed
  - IF ANY of neoip-apps is NOT present, goto "toinstall" state
  - IF ANY of neoip-apps has a version below minimal, goto "toupgrade" state
  - else goto "installed"

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
neoip.webpack_detect_t = function(p_callback)
{
	// copy the parameter
	this.m_callback		= p_callback;
	
	// define the parameters for each neoip-apps inside neoip-webpack
	this.m_apps_params	= { 	"oload"	: {	"first_port"	: 4550,
							"last_port"	: 4553,
							"min_version"	: "0.0.1"
						},
					"casto"	: {	"first_port"	: 4560,
							"last_port"	: 4563,
							"min_version"	: "0.0.1"
						},
					"casti"	: {	"first_port"	: 4570,
							"last_port"	: 4573,
							"min_version"	: "0.0.1"
						}
				};
	// start probing neoip-apps
	this.m_apps_detects	= new Array();
	for(var suffix_name in this.m_apps_params){
		var apps_param	= this.m_apps_params[suffix_name];
		var apps_detect	= new neoip.apps_detect_t(suffix_name
					, apps_param['first_port'], apps_param['last_port']
					, neoip.apps_detect_cb_t(this._apps_detect_cb, this));
		this.m_apps_detects.push( apps_detect );
	}
	// initial state is inprobing
	this._goto_state("inprobing");
}

/** \brief Destructor of player_t
 */
neoip.webpack_detect_t.prototype.destructor = function()
{
	// delete all remainig neoip.apps_detect_t in this.m_apps_detects array
	while( this.m_apps_detects.length > 0 ){
		// delete this apps_detect_t from this.m_apps_detects
		this.m_apps_detects[0].destructor();
		this.m_apps_detects.splice(0, 1);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			TODO to comment
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief neoip.apps_detect_t callback
 */
neoip.webpack_detect_t.prototype._apps_detect_cb	= function(apps_detect, userptr, result_str)
{
	var	suffix_name	= apps_detect.suffix_name();
	// log the result
	//console.info("enter suffix_name=" + apps_detect.suffix_name() + " result_str=" + result_str);
	// delete this neoip.apps_detect_t in this.m_apps_detects array
	for(var idx in this.m_apps_detects){
		if( apps_detect != this.m_apps_detects[idx] )	continue;
		// delete this apps_detect_t from this.m_apps_detects
		this.m_apps_detects[idx].destructor();
		this.m_apps_detects.splice(idx, 1);
	}
	
	// if some neoip.apps_detect_t are unfinished, return now
	if( this.m_apps_detects.length > 0 )	return;

	// log to debug
	//console.info("ALL apps_detect has been completed");
	
	// IF ANY of neoip-apps is NOT present, goto "toinstall" state
	for(var suffix_name in this.m_apps_params){
		// if this neoip-apps is present, goto the next
		if( neoip.apps_present(suffix_name) )	continue;
		// goto state "toinstall" and return
		this._goto_state("toinstall");
		return;	
	}
	
	// IF ANY of neoip-apps is NOT present, goto "toupgrade" state
	for(var suffix_name in this.m_apps_params){
		var min_version	= this.m_apps_params[suffix_name]['min_version'];
		// if this neoip-apps version is checked ok, goto the next
		if( neoip.apps_version_check(suffix_name, min_version) )	continue;
		// goto state "toupgrate" and return
		this._goto_state("toupgrade");
		return;	
	}
	// IF all previous tests passed, goto "installed" 
	this._goto_state("installed");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief function called to change state
 */
neoip.webpack_detect_t.prototype._goto_state	= function(new_state)
{
	// log to debug
	//console.info("new state=" + new_state);
	// if new_state is "inprobing", return now
	if( new_state == "inprobing" )	return;
	// notify the callback
	this.m_callback(new_state);	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			webpack_detect_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a webpack_detect_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.webpack_detect_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(new_state) {
			fct.call(scope, this, userptr, new_state);
		};
}