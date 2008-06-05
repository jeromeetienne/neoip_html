// 
// this script implement a plistarr_t.item_t for the player_t
// 

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief the track_t for each track of the playlist_t
 */
neoip.plistarr_t.prototype.item_t = function(json_data)
{
	// parse the json_data if provided
	if( json_data )		this._from_json(json_data);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Parsing function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Parse the track_t from track element of a jspf playlist
 */
neoip.plistarr_t.prototype.item_t.prototype._from_json = function(json_data)
{
	this.m_json_data	= json_data;
	
	// sanity check - the produced item_t MUST be valid
	this.check();
}

/** \brief Check that the item_t is valid
 * 
 * - if it is not valid an exception will be thrown
 */
neoip.plistarr_t.prototype.item_t.prototype.check = function()
{
	if( typeof(this.m_json_data['playlist_title']) != "string" )	throw("playlist_title is NOT a string");
	if( typeof(this.m_json_data['playlist_uri']) != "string" )	throw("playlist_uri is NOT a string");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// declare all the methods to read the variables
neoip.plistarr_t.prototype.item_t.prototype.playlist_title	= function()
				{ return this.m_json_data['playlist_title'];	}
neoip.plistarr_t.prototype.item_t.prototype.playlist_uri	= function()
				{ return this.m_json_data['playlist_uri'];	}
neoip.plistarr_t.prototype.item_t.prototype.external_dep	= function()
				{ return this.m_json_data['external_dep'];	}


/** \brief Return true if this item_t is playable, false otherwise
 *
 * - is_playable() == does the external_dep fully satisfied
 */
neoip.plistarr_t.prototype.item_t.prototype.is_playable		= function()
{
	// if no external_dep is specified, it is playable by default
	if( this.external_dep() == null )		return true;
	// return false, if it is not playable for 'oload'
	if( this._is_not_playable_suffix('oload') )	return false;
	// return false, if it is not playable for 'casto'
	if( this._is_not_playable_suffix('casto') )	return false;
	// return true if all previous tests passed
	return true;
}

/** \brief Return true if this item_t IS NOT playable, false otherwise
 *
 * - is_playable() == does the external_dep fully satisfied
 */
neoip.plistarr_t.prototype.item_t.prototype.is_not_playable	= function()
{
	return !this.is_playable();
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return true if this item_t IS playable for a neoip-apps suffix, false otherwise
 */
neoip.plistarr_t.prototype.item_t.prototype._is_playable_suffix	= function(apps_suffix)
{
	if( this.external_dep() == null )				return true;
	if( this.external_dep()[apps_suffix] == null )			return true;
	if( this.external_dep()[apps_suffix]['required'] != true )	return true;
	if( neoip.apps_present(apps_suffix) )				return true;
	return false;
}

/** \brief Return true if this item_t IS NOT playable for a neoip-apps suffix, false otherwise
 */
neoip.plistarr_t.prototype.item_t.prototype._is_not_playable_suffix	= function(apps_suffix)
{
	return !this._is_playable_suffix(apps_suffix);
}


