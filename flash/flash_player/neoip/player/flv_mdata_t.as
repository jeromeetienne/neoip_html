/*! \file
    \brief Definition of the class flv_mdata_t

\par Brief Description
flv_mdata_t store the informations about the metadata of flv files
- they can come from 
  - external data (aka not inside the flv file)
  - internal data (aka from inside the flv file)

*/

/** \brief Definition of the package
 */
package neoip.player {

// list of all import for this package
import neoip.debug.console;
	
/** \brief Class to contain the metadata for flv files
 */
public class flv_mdata_t {

// definition of the fields in this class
private var m_video_width	:Number;
private var m_video_height	:Number;
private var m_kframe_time_arr	:Array;
private var m_kframe_offs_arr	:Array;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function flv_mdata_t()
{
	m_kframe_time_arr	= new Array;
	m_kframe_offs_arr	= new Array;	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			static function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build a flv_mdata_t from external storage
 */
static public function from_external(ext_data:String)	:flv_mdata_t
{
	XML.ignoreWhitespace	= true;
	var xml_input:XML	= new XML(ext_data);
	// log to debug
	console.info("external data=" + ext_data);

	//convert the xml in the expected format
	// - TODO which format is the proper one, is unknown
	// - should i do a struct flv_mdata_t ?
	// - for regularity internal and external flv mdata should produce the same
	var flv_mdata	:flv_mdata_t	= new flv_mdata_t;
	var tmp_arr	:Array;
	var i		:int;

	// parse the m_kframe_time_arr
	flv_mdata.m_kframe_time_arr	= new Array;
	tmp_arr	= xml_input..keyframes.times.text().split(", ");
	for(i = 0; i < tmp_arr.length; i++)
		flv_mdata.m_kframe_time_arr.push(Number(tmp_arr[i]));

	// parse the m_kframe_offs_arr
	flv_mdata.m_kframe_offs_arr	= new Array;
	tmp_arr	= xml_input..keyframes.filepositions.text().split(", ");
	for(i = 0; i < tmp_arr.length; i++)	
		flv_mdata.m_kframe_offs_arr.push(Number(tmp_arr[i]));

	// parse the video_width and video_height
	flv_mdata.m_video_width	= Number(xml_input..video_width.text());
	flv_mdata.m_video_height= Number(xml_input..video_height.text());
	
	// return the just built flv_mdata
	return flv_mdata; 
}

/** \brief Build a flv_mdata_t from internal storage (Aka inside the flv itself) 
 */
static public function from_internal(metadata:Object)	:flv_mdata_t
{
	var flv_mdata:flv_mdata_t	= new flv_mdata_t();
	// TODO very crude - do more
	
	//console.info("keyframes=" + metadata['keyframes'].toString());
	// copy the keyframes if present
	if( metadata['keyframes'] ){
		flv_mdata.m_kframe_time_arr	= metadata['keyframes']['times'];
		flv_mdata.m_kframe_offs_arr	= metadata['keyframes']['filepositions'];
	}

	// get the width and height
	flv_mdata.m_video_width	= metadata['width'];
	flv_mdata.m_video_height= metadata['height'];
	
	if( !flv_mdata.m_video_width )	flv_mdata.m_video_width	= 320;
	if( !flv_mdata.m_video_height )	flv_mdata.m_video_height= 240;


	//console.info("balbalbla");
	//console.dir(flv_mdata);
	//console.info("bblibliblib");

	// return the just built flv_mdata
	return flv_mdata; 
}

public function get video_width()	:Number	{ return m_video_width;		}
public function get video_height()	:Number	{ return m_video_height;	}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Return the closest kframe byte offset of this time
 */ 
public function closest_kframe_offs(wished_time:Number)	:Number
{
	// sanity check - m_kframe_time_arr and m_kframe_offs_arr MUST have the same length
	console.assert( m_kframe_time_arr.length == m_kframe_offs_arr.length );

	// if there are no kframe present, return 0 by default
	if( m_kframe_time_arr.length == 0 )	return 0;

	// dynamically find the closest keyframes in the mdata_kframe array
	// - TODO would be much faster to do a dychotomy as it is sorted
	var closest_idx:uint		= 0;
	var closest_delta:Number	= Number.MAX_VALUE;
	var time_arr:Array		= m_kframe_time_arr;
	for(var i:uint = 0; i < time_arr.length; i++){
		var current_delta:Number= Math.abs(time_arr[i] - wished_time);
		if( current_delta < closest_delta ){
			closest_idx	= i;
			closest_delta	= current_delta;
		}
	}
	// return the byte offset of the closest_idx
	return m_kframe_offs_arr[closest_idx];
}
	
}	// end of class 
} // end of package