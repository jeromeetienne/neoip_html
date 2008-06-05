/*! \file
    \brief Make all firebug js call act as a no-op (with or without firebug ext installed)

\par Brief Description
- this allow to stay compatible with firebug js calls
  - it consumes less rescource
- it is a simple modification of the firebugx.js from the firebug-lite library
  - it is the same as firebugx.js except that it is enable ALL the time
  - even with firebug is present
  
*/

/** \brief function to disable firebug calls
 *
 * - this is stored in a function in order to avoid global variable declaration
 */
function disable_firebug()
{
	// list of all the firebug calls
	var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
				"group", "groupEnd", "time", "timeEnd", "count", "trace",
				"profile", "profileEnd"];
	// put an empty function for all firebug calls
	window.console = {};
	for(var i = 0; i < names.length; ++i)	window.console[names[i]] = function() {}
}

// disable_firebug
disable_firebug();