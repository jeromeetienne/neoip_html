/*! \file
    \brief Definition of gc_force

\par Brief Description
TODO to comment

- idea found at http://www.gskinner.com/blog/archives/2006/08/as3_resource_ma_2.html
- NOT TESTED 
  - initial low testing say 'not working' 
  
*/

/** \brief Definition of the package
 */
package neoip.debug
{

// list of all import for this package
import flash.net.LocalConnection;

/** \brief force the execution of the garbage collector
 */
public function gc_force()	:void
{
	try {
		new LocalConnection().connect('foo');
		new LocalConnection().connect('foo');
	} catch(e:*){}
	// the GC will perform a full mark/sweep on the second call.
}

} // end of package