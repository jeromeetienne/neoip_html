/*! \file
    \brief Definition of the neoip.objembed_initmon_t

\par Brief Description
This object implement a monitor which notify when a given objembed to be initialized.
- the browser may not create the object immediatly after its insertion in the page.
- after the object is created, additionnal time is required for it to initialize itself.
- objembed_initmon_t allows to be notified when this objembed is ready to be used.

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor of the object
 */
neoip.objembed_initmon_t = function()
{
	// log to debug
	//console.info("enter");
	// init some parameters
	this.m_cur_delay	= 0.1*1000;
	this.m_end_delay	= 5.0*1000;
}

/** \brief destructor of the object
 */
neoip.objembed_initmon_t.prototype.destructor = function()
{
	// log to debug
	//console.info("enter");
	// delete the m_expire_timeout if needed
	if( this.m_expire_timeout ){
		clearTimeout( this.m_expire_timeout );
		this.m_expire_timeout	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the operation
 */
neoip.objembed_initmon_t.prototype.start = function(html_id, fct_str, callback)
{
	// log to debug
	//console.info("enter html_id=" + html_id +  " fct_str=" + fct_str);
	// copy the parameters
	this.m_html_id	= html_id;
	this.m_fct_str	= fct_str;
	this.m_callback	= callback;
	
	// start the next timeout
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_cur_delay);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_expire_timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The _expire_timeout_cb
 */
neoip.objembed_initmon_t.prototype._expire_timeout_cb	= function()
{
	// log to debug
	//console.info("enter");
	// stop the expire_timeout
	clearInterval( this.m_expire_timeout );
	this.m_expire_timeout	= null;
	
	// get the embed_elem in the page
	var embed_elem	= document.getElementById(this.m_html_id);
	// if embed_elem exists and has fct_str, notify the callback
	if( embed_elem != undefined && eval("typeof(embed_elem."+this.m_fct_str+")") == "function"){
		this.m_callback();
		return;
	}
	
	// NOTE: at this point, the objembed is NOT YET initialized

	// do the exponantial backoff on this.m_cur_delay, clamped by max_delay
	this.m_cur_delay	= this.m_cur_delay * 2;
	this.m_cur_delay	= Math.min(this.m_cur_delay, this.m_end_delay);

	// start the next timeout
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_cur_delay);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			objembed_initmon_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a objembed_initmon_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.objembed_initmon_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function() {
			fct.call(scope, this, userptr);
		};
}
