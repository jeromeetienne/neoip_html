/*! \file
    \brief Definition of the emulation of firebug console object from actionscript

\par Brief Description



\par TODO
- the log function should really emulate the firebug one
  - aka handle the various numbers of argument too
  - important to get "%o"
- TODO put this in neoip.debug. as it is debug stuff



*/

/** \brief Definition of the package
 */
package neoip.debug
{

// list of all import for this package	
import flash.external.ExternalInterface;

/** \brief Class to emulate firebug console object
 * 
 * - well it evolves more in a generic debug stuff :)
 */
public class console
{
	
	
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			loggin function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief TODO to comment
 */
public static function log(...var_arg)			:void
{
	// forward it to javascript console.log
	console.post_log(var_arg);
}

/** \brief TODO to comment
 */
public static function info(...var_arg)	:void
{
	// use neoip.debug.backtrace() to get the location of the caller
	var backtrace:Array	= neoip.debug.backtrace();
	if( backtrace && backtrace.length >= 3 ){
		var location:Object	= backtrace[2];
		var_arg[0]	= location.basepath + ":" + location.line_num + ":" 
				+ location.plain_func + " " + var_arg[0];	
	}

	// forward it to javascript console.log
	console.post_log(var_arg);
}

public static function debug(...var_arg)	:void
{
}

/** \brief TODO to comment
 */
public static function post_log(var_arg	:Array)		:void
{
	// forward it to javascript console.log
	
	// - NOTE: expand up to 4 parameters
	// - could it be done more cleanly ?
	if( var_arg.length == 1 ){
		ExternalInterface.call("console.log", var_arg[0]);
	}else if( var_arg.length == 2 ){
		ExternalInterface.call("console.log", var_arg[0], var_arg[1]);
	}else if( var_arg.length == 3 ){
		ExternalInterface.call("console.log", var_arg[0], var_arg[1], var_arg[2]);
	}else if( var_arg.length == 4 ){
		ExternalInterface.call("console.log", var_arg[0], var_arg[1], var_arg[2], var_arg[3]);
	}else{	console.assert(false);	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			weirdo firebug function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief TODO to comment
 */
public static function dir(obj:Object)			:void
{
	ExternalInterface.call("console.dir", obj);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			core assert function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief assert with boolean and optionnal prefix_str
 */
public static function assert(expression:Boolean, prefix_str:String = "")	:void
{
	// if this assert is not triggered return now
	if( expression == true )	return;

	// build the string to log
	var str:String	= "Assertion failed!"; 
	if( prefix_str.length > 0 )	str	+= " " + prefix_str + ". ";
	// forward the display to console.post_assert()
	console.post_assert(str);
}

/** \brief post processing for assert
 */
private static function post_assert(prefix_str:String)	:void
{
	var str		:String	= "";
	var backtrace	:Array	= neoip.debug.backtrace();
	var location	:Object;		
	
	// use neoip.debug.backtrace() to get the location of the caller
	if( backtrace && backtrace.length >= 4 ){
		location= backtrace[3];
		str	= location['basepath'] + ":"	+ location['line_num'] + ":"
							+ location['plain_func'];	
	}
	str	+= " " + prefix_str + " ";

	// put the stackframe of the assert caller into str
	if( 0 ){
		// raw version with flash stacktrace
		// - NOTE: left here because im not confident with the backtrace.as parser
		try {			throw new Error();
		}catch( e:Error ){	str += e.getStackTrace();	}
	}else{
		// cooked version 
		backtrace.shift();
		backtrace.shift();
		backtrace.shift();
		str	+=	"\n";
		for(var i:int = 0; i < backtrace.length; i++){
			location = backtrace[i];
			// if this location is not complete, goto the next
			// - NOTE: it may simple be not properly parsed
			if( typeof(location['line_num']) == "undefined" )	continue;
			// add the location to the str		
			str	+= location['pretty_func'] + "[" + location['fullpath']
							+ ":" + location['line_num'] + "]";
			str	+= "\n";
		}
	}
	// send all that to console.log
	ExternalInterface.call("console.error", str);
	
	// throw an exception to stop the processing
	throw new Error("ASSERT FAILED");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			assert with explicit condition
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief assert with explicit condition "eq"
 */
public static function assert_eq(val1:*, val2:*, prefix_str:String = "")	:void
{
	// test if the assert is triggered or not, if not, return now 
	if( val1 == val2 )	return;
	// forward to console.post_assert_cond	
	console.post_assert_cond(val1, val2, "==", prefix_str);
}

/** \brief assert with explicit condition "ne"
 */
public static function assert_ne(val1:*, val2:*, prefix_str:String = "")	:void
{
	// test if the assert is triggered or not, if not, return now 
	if( val1 != val2 )	return;
	// forward to console.post_assert_cond	
	console.post_assert_cond(val1, val2, "!=", prefix_str);
}

/** \brief assert with explicit condition "ge"
 */
public static function assert_ge(val1:*, val2:*, prefix_str:String = "")	:void
{
	// test if the assert is triggered or not, if not, return now 
	if( val1 >= val2 )	return;
	// forward to console.post_assert_cond	
	console.post_assert_cond(val1, val2, ">=", prefix_str);
}

/** \brief assert with explicit condition "gt"
 */
public static function assert_gt(val1:*, val2:*, prefix_str:String = "")	:void
{
	// test if the assert is triggered or not, if not, return now 
	if( val1 > val2 )	return;
	// forward to console.post_assert_cond	
	console.post_assert_cond(val1, val2, "> ", prefix_str);
}

/** \brief assert with explicit condition "le"
 */
public static function assert_le(val1:*, val2:*, prefix_str:String = "")	:void
{
	// test if the assert is triggered or not, if not, return now 
	if( val1 <= val2 )	return;
	// forward to console.post_assert_cond
	console.post_assert_cond(val1, val2, "<=", prefix_str);
}

/** \brief assert with explicit condition "lt"
 */
public static function assert_lt(val1:*, val2:*, prefix_str:String = "")	:void
{
	// test if the assert is triggered or not, if not, return now 
	if( val1 < val2 )	return;
	// forward to console.post_assert_cond	
	console.post_assert_cond(val1, val2, "< ", prefix_str);
}

/** \brief post processing for assert with explicit condition
 */
private static function post_assert_cond(val1:*, val2:*, cond_str:String
						, prefix_str:String)	:void
{
	// build the string to log
	var str:String	= "Assertion " + val1 + cond_str + val2 + " failed!"; 
	if( prefix_str.length > 0 )	str	+= " " + prefix_str + ".";
	// forward the display to console.post_assert()
	console.post_assert(str);
}



}	// end of class 
} // end of package