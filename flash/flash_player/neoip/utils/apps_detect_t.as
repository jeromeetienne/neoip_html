/*! \file
    \brief Definition of the class apps_detect_t

\par Brief Description
apps_detect_t perform a detection for a given neoip-apps

\par TODO
- if the host is unreachable, the urlLoader of the xmlrpc will NEVER come
  back.... couch couh
  - so rather bad in case the apps is not present
- the mattism library is pure crap, i had to handle the IOError myself
  - dont use it and do your own
- TODO in anycase, handle a timer to expire
- TODO to be better... launch several xmlrpc at the same time

*/
 
/** \brief Definition of the package
 */
package neoip.utils {
	

// list of all import for this package
import com.mattism.http.xmlrpc.*;
import com.mattism.http.xmlrpc.util.*;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.TimerEvent;
import flash.utils.Timer;

import neoip.debug.console;
	
/** \brief Class to perform a probing for a given neoip-apps
 */
public class apps_detect_t {

// definition of the fields in this class
private var m_apps_suffix	:String;
private var m_port_beg		:uint;
private var m_port_end		:uint;
private var m_callback		:Function;

private var m_current_port	:uint;

private var m_xmlrpc		:Connection;
private var m_expire_timer	:Timer;
private var m_expire_delay	:Number		= 10 * 1000;

//! definition of the default port_beg/port_end per apps_suffix
public	static const OLOAD_PORT_BEG	:uint	= 4550;
public	static const OLOAD_PORT_END	:uint	= 4559;
public	static const CASTO_PORT_BEG	:uint	= 4560;
public	static const CASTO_PORT_END	:uint	= 4569;
public	static const CASTI_PORT_BEG	:uint	= 4570;
public	static const CASTI_PORT_END	:uint	= 4579;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function apps_detect_t(p_apps_suffix:String, p_port_beg:uint, p_port_end:uint
					, p_callback:Function)
{
	// copy the parameters
	m_apps_suffix	= p_apps_suffix;
	m_port_beg	= p_port_beg;
	m_port_end	= p_port_end;
	m_callback	= p_callback;

	// initialize m_expire_timer
	m_expire_timer	= new Timer(m_expire_delay);
	m_expire_timer.addEventListener(TimerEvent.TIMER, expire_timer_cb);
	m_expire_timer.start();
	
	// initialize the current posrt
	m_current_port	= m_port_beg 
	// launch the first probe
	launch_next_probe();
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// delete m_xmlrpc if needed
	if( m_xmlrpc ){
		// TODO how to stop it ? remove the event listener ?
		m_xmlrpc	= null;
	}
	// delete m_expire_timer if needed
	if( m_expire_timer ){
		m_expire_timer.stop();
		m_expire_timer	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Launch the next probe
 */
private function launch_next_probe()	:void
{
	// create the xmlrpc_uri
	var xmlrpc_uri:String	= "http://127.0.0.1:" + m_current_port + "/neoip_" 
					+ m_apps_suffix + "_appdetect_xmlrpc.cgi";
	// log to debug
	console.info("Launch a probe toward " + xmlrpc_uri);
	// create the xmlrpc_cnx
	m_xmlrpc	= new ConnectionImpl(xmlrpc_uri);
	// initialize the callbacks
	m_xmlrpc.addEventListener(Event.COMPLETE	, xmlrpc_onComplete	);
	m_xmlrpc.addEventListener(ErrorEvent.ERROR	, xmlrpc_onError	);
	// actually start the xmlrpc
	m_xmlrpc.call('probe_apps');
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			xmlrpc callbacks
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief xmlrpc callback for Event.COMPLETE
 */
private	function xmlrpc_onComplete(event:Event)	:void
{
	var version:Object	= m_xmlrpc.getResponse();
	// log to debug
	//console.info("onComplete found " + m_apps_suffix + " version " + version + " on port " + m_current_port);
	// notify a success with the just built flv_mdata_t
	m_callback("success", version, m_current_port);
}

/** \brief xmlrpc callback for EventError.ERROR
 */
private function xmlrpc_onError(evt:ErrorEvent)	:void
{
	var fault:MethodFault = m_xmlrpc.getFault();
	// log to debug
	//console.info("onError NOT found " + m_apps_suffix + " on port " + m_current_port);
	// if no more port to test, notify faillure
	if( m_current_port == m_port_end ){
		m_callback("failure", null, null);
		return;
	}
	// increase m_current_port and launch the next probe 
	m_current_port++;
	launch_next_probe();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_expire_timer callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the m_expire_timer
 */
private function expire_timer_cb(eventArgs:TimerEvent)	:void
{
	m_callback("timedout", null, null);
}


}	// end of class 
} // end of package