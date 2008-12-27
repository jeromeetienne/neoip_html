/** \brief Definition of the package
 */
package neoip.player {

// list of all import for this package
import neoip.player.track_t;
import neoip.debug.console;

	
/** \brief Class to contain the playlist
 */
public class playlist_t {


// definition of the fields in this class
// TODO this stuff should not public
public var m_track_arr	:Array;		//!< the array to contains all the player.track

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function playlist_t()
{
	// initiliazie the track_arr
	m_track_arr	= new Array();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function	track_add(track_arg:Object, track_idx:Number)	:void
{
	// create the track_t for this track_arg
	var track:track_t	= new track_t(track_arg);
	// insert the track into the track_arr
	m_track_arr.splice(track_idx, 0, track);
}

public function	track_del(track_idx:Number)	:void
{
	// remove the track_idx from the track_arr
	m_track_arr.splice(track_idx, 1);
}

public function	track_get(track_idx:Number)	:Object
{
	// return the track_arg
	return m_track_arr[track_idx].arg();
}

/** \brief Return the number of track in the playlist
 */
public function	track_count()		:Object
{
	return m_track_arr.length;
}

public function get track_arr()	:Array
{
	return m_track_arr;
}



}	// end of class 
} // end of package