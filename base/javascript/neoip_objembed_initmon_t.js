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
	console.info("enter");
	// init some parameters
	this.m_cur_delay	= 0.1*1000;
	this.m_end_delay	= 5.0*1000;

// TODO temporary while i fix the adobe_air2 loading delay
// - make it such as it is used only for air
// - or fix air
// - is it webkit ?
	//this.m_cur_delay	= 3*1000;
	//this.m_end_delay	= 15.0*1000;
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
 * @param obj_fcts {string|Array} the function to test on the html id
 */
neoip.objembed_initmon_t.prototype.start = function(html_id, obj_fcts, callback)
{
	// log to debug
	console.info("enter html_id=" + html_id +  " obj_fcts=" + obj_fcts);
	// copy the parameters
	this.m_html_id	= html_id;
	this.m_obj_fcts	= obj_fcts instanceof Array ? obj_fcts : [obj_fcts];
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

/** \brief test is the 
*/
neoip.objembed_initmon_t.prototype._emdeb_do_exist	= function()
{
	// get the embed_elem in the page
	var embed_elem	= document.getElementById(this.m_html_id);
	// if embed_elem exists and has fct_str, notify the callback
	if( embed_elem == undefined )	return false;
	
	// if embed_elem exists and has fct_str, notify the callback
	for(var i = 0; i < this.m_obj_fcts.length; i++){
		// TODO this eval may likely remove
		// old version: if( eval("typeof(embed_elem."+this.m_obj_fcts+")") != "function")
		if( typeof embed_elem[this.m_obj_fcts[i]] !== 'function' )
			return false;
	}
	return true;
}

/** \brief The _expire_timeout_cb
 */
neoip.objembed_initmon_t.prototype._expire_timeout_cb	= function()
{
	// log to debug
	//console.info("enter");
	// stop the expire_timeout
	clearInterval( this.m_expire_timeout );
	this.m_expire_timeout	= null;
	
	// if the embed element do exist, notify the callback now
	if(this._emdeb_do_exist()){
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
