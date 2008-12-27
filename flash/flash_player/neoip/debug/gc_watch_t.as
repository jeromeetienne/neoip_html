/*! \file
    \brief Definition of gc_watch_t

\par Brief Description
TODO to comment
- allow to be notified when a given object is deleted by the garbage collector
- from http://www.danielhai.com/blog/?p=49

\par TODO
- currently only a sketch
- moreover the testing seem to say 'dont work'
- more experiment needed
 
*/

/** \brief Definition of the package
 */
package neoip.debug
{

// list of all import for this package
import neoip.debug.console;
import flash.events.EventDispatcher;
import flash.events.TimerEvent;
import flash.utils.Dictionary;
import flash.utils.Timer;
import flash.utils.getQualifiedClassName;

/** \brief log the event when a given object is deleted by the garbage collection
 */
public class gc_watch_t {

private var m_dict	:Dictionary	= new Dictionary(true);
private var m_timer	:Timer		= new Timer(1*1000);
private var m_lastTrace	:String;

/** \brief Constructor
 */
public function gc_watch_t(obj:Object)	:void
{
	// put the object as key in the Dictionnary
	// - NOTE: the dictionnary has been setup to use 'weakreference'
	//   - so this obj will disapears from the dictionnary if no other reference
	//     exists
	m_dict[obj] = 1;

	// start a timer to probe the state of this object in the dictionnary
	m_timer.addEventListener(TimerEvent.TIMER, _onTimer);
	m_timer.start();
}

/** \brief TimerEvent.TIMER callback
 */
private function _onTimer(event:TimerEvent)	:void
{
	// test if the object is still in the dictionnary
	for (var i:Object in m_dict) {
		// log to debug
		console.info("still here");
		// if still existing, log the string description of this object
		m_lastTrace = i.toString();
		return;
	}
	// if this object has been deleted, stop the timer 
	m_timer.removeEventListener(TimerEvent.TIMER, _onTimer);
	m_timer.stop();
	// log the event
	console.info('GC:' + m_lastTrace);
}

}	// end of class
} // end of package