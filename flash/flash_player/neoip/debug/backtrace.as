/*! \file
    \brief Definition of backtrace

\par Brief Description
TODO to comment

- idea found at http://www.jooce.com/blog/?p=37
- 


- Trick to get the stack trace at any time
  - use it to get the console.log line/function/file
  - from http://www.jooce.com/blog/?p=37
    - this stuff got trick to monitor when an object is freed from memory too
  - this requires the debug version of the flash-player tho
	try {
		throw new Error()
	}catch( e:Error ){
		console.log("slota " + e.getStackTrace());
		console.log("sloti");
	}

*/

/** \brief Definition of the package
 */
package neoip.debug
{

// list of all import for this package
import neoip.debug.console;


/** \brief function returning a array containing the backtrace
 * 
 * - TODO to cleanup. this is only a sketch to test
 * - NOTE: during debug, be carefull with the loggin within this function
 *   - logging functions may use this and so it would create a infinite loop :)
 */
public function backtrace()	:Array
{
	var result_arr		:Array	= new Array;
	var stacktrace_str	:String;

	// get the stacktrace_str
	// - this uses a trick "any exception get a stacktrace generated"
	// - so generate a dummy one just to get the current stack trace.
	try {			throw new Error();
	}catch( e:Error ){	stacktrace_str	= e.getStackTrace();	}
	
	// if stacktrace_str is null, return now
	// - this happens when the flash-player is not a debug version
	if( stacktrace_str == null )	return result_arr;
	
	//console.log("slotaddddd " + stacktrace_str);
	var line_arr	:Array	= stacktrace_str.split("\n");
	for(var i:int = 1; i < line_arr.length; i++){

		var result:Object	= new Object;
		
		var line	:String	= line_arr[i];
		//console.log("line " + i+ ": " + line);

		var fileline_sepa:int	= line.indexOf("["); 
		
		var post_at	:int	= line.search("at ");
		result['pretty_func']	= line.substring(post_at+3, fileline_sepa);
		//console.log("fct_name=" + result['pretty_func']);

		
		if( fileline_sepa != -1 ){
			//console.log("fileline " + i+ ": " + line.substr(fileline_sepa+1));
			var fileline_str:String	= line.substr(fileline_sepa+1);
			var file_sepa	:int	= fileline_str.indexOf(":");
			var linenum_end	:int	= fileline_str.indexOf("]");
			if( file_sepa != -1 ){
				var linenum_str	:String	= fileline_str.substring(file_sepa+1, linenum_end);
				result['fullpath']	= fileline_str.substr(0, file_sepa);
				result['line_num']	= int(linenum_str);				
				//console.log("fullpath=" + result['fullpath']);
				//console.log("line_num=" + result['line_num']);
			}	
			
		}
		
		// if there is a fullpath, determine a basepath
		if( result['fullpath'] ){
			var path_level	:Array;
			path_level		= result['fullpath'].split("/"); 
			result['basepath']	= path_level[path_level.length - 1];
		}

		// if there is a pretty_func, determine a function
		if( result['pretty_func'] ){
			var tmp_arr	:Array;
			tmp_arr			= result['pretty_func'].split("::");
			result['plain_func']	= tmp_arr[tmp_arr.length - 1];
			tmp_arr			= result['plain_func'].split("/");
			result['plain_func']	= tmp_arr[tmp_arr.length - 1];
		}
		
		// put this result in the result_arr		
		result_arr.push(result);
	}
	
	// return the backtrace array
	return result_arr;
}

} // end of package