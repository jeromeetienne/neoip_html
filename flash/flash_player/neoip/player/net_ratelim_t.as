/*! \file
    \brief Definition of the class net_ratelim_t

\par Brief Description
net_ratelim_t is able to limit the rate of the download for NetStream.

\par BUG BUG
- at the end of the video the rate goes very high
  - related to how to determine the end of the video
  - not a real trouble but notify high ratio without need
  - POSSIBLE SOLUTION: it may be fixed with use m_stream.byteTotal
- if the network connection is closed because the file is fully downloaded
  - the xmlrpc will still be issued resulting in failing xmlrpc
  - neoip-oload reports that the httpo_full_id is unknown via a xmlrpc fault
  - POSSIBLE SOLUTION: detect if it is connection still exists
    - sure but how ?

\par Motivation
- usually, a video/audio player download data as they are played
  - with a little buffer to absorbe variation in the network bandwidth
- flash player got a bug/feature which makes it download flv as fast as it can.
- moreover downloading data in flash player consumes a non-negligible amount of CPU
- This is important because to take full advantage of the p2p sharing
  All the peers must read the same part of the file.
  - if they are all watching the same part of the video and download
    only 10sec ahead. they will all try to download the same data at the 
    same time and so will be able to share more easily.   
- the two bug/features together got significant consequences
- monster case:
  - a user plays a movie of 40kbyte/s but the bandwidth is 1mbyte/s
  - 20% of a p4 2.6ghz is used *only* by the download (aka not the decoding/display)
  - moreover the bandwidth is wasted which impact the client and the server
    - which implies financial cost for the server
   
\par Implementation
- net_ratelim_t uses a feature of neoip-oload which allows to control the rate
  at which a client http connection is delivered
- it periodically update this rate to mimic the usual video player behaviour

\par About 'dual bufferTime'
- the issue: NetStream.bufferLength is clamped NetStream.bufferTime, no matter how
  much is actually downloaded.
- the workaround: have a small NetStream.bufferTime to start playing as soon as possible
  BUT once started playing, increase the NetStream.bufferTime to get NetStream.bufferLength
  on a wider range.
- The name is inspired from the web. here are references
  - http://www.adobe.com/devnet/flashmediaserver/articles/fms_dual_buffering.html
  - http://labs.influxis.com/?p=4

\par Possible Improvements
- when the source is on lan (10mbyte/s) it download too fast at first
  - maybe do something for that..
  - like shorted period at the begining
  - increasing timer period when it is close to 0s ahead ?
- if the maxrate doesnt change, or change only a little, dont do xmlrpc

*/

/** \brief Definition of the package
 */
package neoip.player {

// list of all import for this package
import com.mattism.http.xmlrpc.*;
import com.mattism.http.xmlrpc.util.*;

import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.NetStatusEvent;
import flash.events.TimerEvent;
import flash.net.NetStream;
import flash.utils.Timer;

import neoip.debug.console;

/** \brief Class to contain the rate limiter for NetStream
 */
public class net_ratelim_t {

// definition of the fields in this class
private var m_outter_uri	:String;
private var m_httpo_full_id	:String;
private var m_stream		:NetStream;
private var m_update_period	:Number		= 1.0 * 1000;
private var m_update_timer	:Timer;
private var m_xmlrpc		:ConnectionImpl;
private var m_limit_arr		:Array		= new Array;
private var m_buffertime_hi	:Number;
private var m_buffertime_lo	:Number;
private var m_prev_maxrate	:Number;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function net_ratelim_t()
{
	// put a default m_limit_arr
	// TODO put a function to make it tunable fromjs
	m_limit_arr.push({ time:  0	, rate: 1024*1024	});
	m_limit_arr.push({ time:  5	, rate: 1024*500	});
	m_limit_arr.push({ time: 10	, rate: 1024*100	});
	m_limit_arr.push({ time: 15	, rate: 1024*0		});
}

/** \brief Destructor
 */
public function destructor()	:void
{
	if( m_stream ){
		m_stream.removeEventListener(NetStatusEvent.NET_STATUS, stream_onNetStatus);
		// TODO remove the listener
		m_stream	= null;
	}
	// delete the xmlrpc if needed
	if( m_xmlrpc )	xmlrpc_dtor();
	
	if( m_update_timer ){
		m_update_timer.stop();
		m_update_timer	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the operation
 */
public	function start(p_m_stream:NetStream, p_httpo_full_id:String
						, p_outter_uri:String)		:void
{
	// copy the paramters
	m_stream	= p_m_stream;
	m_httpo_full_id	= p_httpo_full_id;
	m_outter_uri	= p_outter_uri;
	
	// add callback for NET_STATUS			
	m_stream.addEventListener(NetStatusEvent.NET_STATUS, stream_onNetStatus);

	// sanity check - m_limit_arr.length MUST be >= 2
	console.assert( m_limit_arr.length >= 0 )
	// sanity check - m_limit_arr last item .rate MUST be 0 
	console.assert( m_limit_arr[m_limit_arr.length-1].rate == 0 );
	// TODO sanity check - all m_limit_arr is sorted strict increasing order by time

	// set the m_buffertime_lo
	m_buffertime_lo	= 0.1;
	// compute the m_buffertime_hi, aka the time after which the rate is ALWAYS 0kbyte/s
	m_buffertime_hi	= m_limit_arr[m_limit_arr.length-1].time;

	// set m_stream.bufferTimer to m_buffertime_lo at firsts
	m_stream.bufferTime	= m_buffertime_lo;

	// update the maxrate immediatly
	update_maxrate();

	// start the update_timer
	m_update_timer	= new Timer(m_update_period);
	m_update_timer.addEventListener(TimerEvent.TIMER, update_timer_cb);
	m_update_timer.start();
	
	// log to debug
	console.info("POST netratelim start");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the update_timer
 */
private function update_timer_cb(eventArgs:TimerEvent)	:void
{
	//console.info("enter update_timer_cb");
	update_maxrate();
}


/** \brief Compute the current httpo_maxrate
 */
private function	cpu_maxrate()		:Number
{
	var	httpo_maxrate	:Number;
	
	// if m_stream is in m_buffertime_lo, use the fastest rate possible in m_limit_arr
	if( m_stream.bufferTime == m_buffertime_lo )	return m_limit_arr[0].rate; 
	
	// sanity check - here m_stream.bufferTime MUST be m_buffertime_hi
	console.assert( m_stream.bufferTime == m_buffertime_hi );

	// compute the current maxrate according to m_stream.bufferLenth and m_limit_arr
	var	cur_buflen	:Number	= m_stream.bufferLength;
	if( cur_buflen < m_buffertime_hi ){
		// find the hi_bound
		for(var hi_bound:uint = 1; hi_bound < m_limit_arr.length; hi_bound++){
			if( cur_buflen < m_limit_arr[hi_bound].time )	break;
		}
		// sanity check - the hi_bound MUST have been found
		console.assert( hi_bound < m_limit_arr.length );
		// initialize the lo_bound
		var	lo_bound:uint	= hi_bound - 1;

		var	win_time:Number	= m_limit_arr[hi_bound].time - m_limit_arr[lo_bound].time;
		var	win_rate:Number	= m_limit_arr[hi_bound].rate - m_limit_arr[lo_bound].rate;
		var	win_pos:Number	= cur_buflen - m_limit_arr[lo_bound].time;
		var	win_ratio:Number= 1 - (win_time - win_pos)/win_time;
		// compute the maxrate
		httpo_maxrate	= m_limit_arr[lo_bound].rate + win_rate * win_ratio;
	}else{
		// if cur_buflen is >= m_buffertime_hi, then maxrate is always 0
		httpo_maxrate	= 0;
	}

//	console.info("*************************");
//	console.info("MAXRATE " + httpo_maxrate);
//	console.info("*************************");
//	console.info("m_stream time=" 		+ m_stream.time);
//	console.info("m_stream bufferTime="	+ m_stream.bufferTime);
//	console.info("m_stream bufferLength="	+ m_stream.bufferLength);
//	console.info("m_stream byteTotal="	+ m_stream.bytesTotal);
//	console.info("m_stream byteLoaded="	+ m_stream.bytesLoaded);

	// unneeded to keep the fraction of byte :)
	httpo_maxrate	= Math.round(httpo_maxrate);
	
	// return the httpo_maxrate
	return httpo_maxrate;
}


/** \brief Update the httpo_maxrate and do the xmlrpc for it
 */
private	function	update_maxrate()	:void
{
	// cpu the current httpo_maxrate
	var	httpo_maxrate	:Number;
	httpo_maxrate	= cpu_maxrate();

	// launch the xmlrpc to notify neoip-oload of the httpo_maxrate
	xmlrpc_launch(httpo_maxrate);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief callback for m_stream NetStatusEvent.NET_STATUS
 */
private function stream_onNetStatus(event:NetStatusEvent)	:void
{
	var event_type		:String	= event.info.code;
	var buffertime_old	:Number	= m_stream.bufferTime;
	
	// log to debug
	console.info("************ event_type=" + event_type + " *********");
	
	// if m_stream buffer is full, use m_buffertime_hi
	if( event_type == "NetStream.Buffer.Full" ){
		m_stream.bufferTime = m_buffertime_hi;
	}
	// if m_stream is no more playing, use m_buffertime_lo
	if( event_type == "NetStream.Play.Stop" || event_type == "NetStream.Buffer.Empty" )
		m_stream.bufferTime = m_buffertime_lo;

	// log to debug
	if( m_stream.bufferTime != buffertime_old ){
		console.info("************ 	stream.bufferTime was " + buffertime_old 
				+ " and is now " + m_stream.bufferTime);
	}
	// if m_stream.bufferTime has been changed, update_maxrate() immediatly	
	if( m_stream.bufferTime != buffertime_old )	update_maxrate();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			xmlrpc handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Launch a xmlrpc with httpo_maxrate
 */
private function xmlrpc_launch(httpo_maxrate:Number)	:void
{
	/*************** workaround flash-player bug	***********************/
	// TEMP: TMP: TODO:
	// NOTE: bug description: if the remote peer of a tcp connection doesnt
	// send data (like with httpo_maxrate), then flash-player dont close
	// the connection even it is declare to do it.
	// - NetConnection.close() for example 
	// - and if httpo_maxrate == 0, no data is sent
	// - so setting it to 1*1024, workaround this bug
	// - TODO would be better to set to 1-byte but it takes 100% cpu in neoip-oload
	//   - reason unknown. to fix
	if( httpo_maxrate == 0 )	httpo_maxrate	= 1*1024;

	// log to debug
	//console.info("cnx uri=" + m_outter_uri + "/neoip_oload_httpo_ctrl_xmlrpc.cgi");
	//console.info("m_httpo_full_id=" + m_httpo_full_id);
	//console.info("httpo_maxrate=" + httpo_maxrate);

	// if there is already m_xmlrpc running, dont launch a new one
	if( m_xmlrpc )	return;
	
	// if this httpo_maxrate is the same as before, no need to do an xmlrpc for it
	// - just to reduce the load a little bit
	// - the load is low anyway as it is over localhost
	if( httpo_maxrate == m_prev_maxrate )	return;	
	// update m_prev_maxrate with the current one
	m_prev_maxrate	= httpo_maxrate;
	
	// log to debug
	console.info("*************** do xmlrpc httpo_maxrate=" + httpo_maxrate);

	// ok seems to work in failure and success
	m_xmlrpc	= new ConnectionImpl(m_outter_uri);
	// add the listeners
	m_xmlrpc.addEventListener(Event.COMPLETE	, xmlrpc_onComplete);
	m_xmlrpc.addEventListener(ErrorEvent.ERROR	, xmlrpc_onError);
	// setup the call parameters
	m_xmlrpc.addParam(m_httpo_full_id	, XMLRPCDataTypes.STRING);
	m_xmlrpc.addParam(String(httpo_maxrate)	, XMLRPCDataTypes.STRING);
	// start the call itself
	m_xmlrpc.call('set_httpo_maxrate');
}

private	function xmlrpc_dtor()			:void
{
	// if m_xmlrpc is already null, do nothing
	if( m_xmlrpc == null )	return
	// TODO remove the listener
	m_xmlrpc.removeEventListener(Event.COMPLETE	, xmlrpc_onComplete);
	m_xmlrpc.removeEventListener(ErrorEvent.ERROR	, xmlrpc_onError);
	m_xmlrpc.destructor();
	m_xmlrpc	= null;
}


/** \brief xmlrpc callback for Event.COMPLETE
 */ 
private	function xmlrpc_onComplete(event	:Event):void
{
	//var response:Object = m_xmlrpc.getResponse();
	//console.info("xmlrpc complete");
	
	// delete the xmlrpc
	xmlrpc_dtor();
}

/** \brief xmlrpc callback for ErrorEvent.ERROR
 */ 
private function xmlrpc_onError(event	:ErrorEvent):void
{
	var fault	:MethodFault = m_xmlrpc.getFault();
	// log to debug
	console.info("error");
	// if fault is not null, then it is a xmlrpc error
	if( fault != null ){
		console.info("xmlrpc fault code=" + fault.getFaultCode() 
				+ " string=" + fault.getFaultString());
	}
	// delete the xmlrpc
	xmlrpc_dtor();
}


}	// end of class 
} // end of package