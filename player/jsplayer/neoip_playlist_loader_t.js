/*! \file
    \brief Definition of the neoip.playlist_loader_t

- TODO the xmlHttpRequest is currently insync
  - this is an remain of experimentation
  - this is useless and harmfull
  - make it async

\par Brief Description
This object implement the mechanism to periodically reload playlist. this 
is part of the 'infinitly long playlist'.

\par Note Implementation
- caching workaround
  - it seems that the result of XMLHttpRequest got cached by firefox
  - so add a fake uri variable with a random number in it to workaround the cache


*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			playlist_loader_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor 
 */
neoip.playlist_loader_t	= function(p_playlist_uri, p_callback) 
{
	// copy the parameter
	this.m_playlist_uri	= p_playlist_uri;
	this.m_callback		= p_callback;
	
	// start the initial m_reload_timeout
	this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this), 0);
}

/** \brief Destructor
 */
neoip.playlist_loader_t.prototype.destructor	= function()
{
	// log to debug
	//console.info("enter playlist_loader_t dtor");
	// delete the timeout if needed
	if( this.m_reload_timeout ){
		clearTimeout(this.m_reload_timeout);
		this.m_reload_timeout	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Load the playlist from the m_playlist_uri
 */
neoip.playlist_loader_t.prototype._load_playlist_now	= function()
{
	// log to debug
	console.info("load playlist " + this.m_playlist_uri);
	// delete the timeout if needed
	if( this.m_reload_timeout ){
		clearTimeout(this.m_reload_timeout);
		this.m_reload_timeout	= null;
	}	
	// load the data
	var playlist_str	= neoip.core.download_file_insync(this.m_playlist_uri, true);
	if( playlist_str == null ){
		var retry_delay	= 10*1000;	// TODO make this tunable
		console.info("unable to load playlist at " + this.m_playlist_uri + ". will retry in " + retry_delay + "-sec");
		this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this)
								, retry_delay);
		return;
	}

	// build the playlist_t
	var playlist	= new neoip.playlist_t(playlist_str);
	// init the reload timeout if needed
	if( playlist.reload_delay() ){
		this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this)
						, playlist.reload_delay());
	}
	// update the playlist in the player 
	// - NOTE: this MUST be the last thing done in this function
	//   - it allows the callback to destroy this object
	this._notify_callback("new_playlist", { "playlist" : playlist });			
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The timeout callback
 */
neoip.playlist_loader_t.prototype._reload_timeout_cb	= function()
{
	// simply forward to load_playlist_now
	this._load_playlist_now();
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The flash plugin event callback
 */
neoip.playlist_loader_t.prototype._notify_callback	= function(event_type, arg)
{
	// log to debug
	//console.info("event_type=" + event_type + " arg=" + arg);
	
	// if no callback is defined, do nothing
	if( this.m_callback == null )	return;
	// forward the event to the callback
	this.m_callback(event_type, arg);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			playlist_loader_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a playlist_loader_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.playlist_loader_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}


