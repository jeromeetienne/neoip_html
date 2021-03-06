// 
// this script implement a plistarr_t.item_t for the player_t
// 

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief the track_t for each track of the playlist_t
 */
neoip.plistarr_t = function(json_str)
{
	// create an empty item_arr
	this.m_item_arr	= new Array();
	// parse the json_data if provided
	if( json_str )	this._from_json(json_str);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Parsing function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Parse the json_str
 */
neoip.plistarr_t.prototype._from_json = function(json_str)
{
	// TODO to do eval on json as if if were javascript cause some security issue
	// - IIF the json string is untrusted tho. aka not coming from the same site
	// - some json only parser are available in http://json.org
	// - an additionnal dependancy
	var json_data		= eval('(' + json_str + ')');
	
	// go thru all the json_data
	for(var i = 0; i < json_data.length; i++){
		// create a new item
		var item	= new this.item_t(json_data[i]);
		// put it in the m_item_arr
		this.m_item_arr.push(item);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// declare all the methods to read the variables
neoip.plistarr_t.prototype.item_arr	= function()	{ return this.m_item_arr;	}
neoip.plistarr_t.prototype.reload_delay	= function()	{ return 20*1000;		}

/**
 * Return the plistarr_t as raw data
*/
neoip.plistarr_t.prototype.raw_data	= function(){
	var data	= []
	for(var i = 0; i < this.m_item_arr.length; i++ ){
		var plistarr_item	= this.m_item_arr[i]
		data.push( plistarr_item.raw_data() )
	}
	return data;
}

/**
 * Return true if this playlist_uid is in contained, false otherwise
*/
neoip.plistarr_t.prototype.has_playlist_uid	= function(playlist_uid)
{
	// go thru all item
	for(var i = 0; i < this.item_arr().length; i++ ){
		var	item	= this.item_arr()[i];
		// if this item has the same playlist_uid, return true
		if(item.playlist_uid() == playlist_uid)	return true;
	}
	// if all items got scanned, return false
	return false;	
}
