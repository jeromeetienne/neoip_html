/*! \file
    \brief Definition of the class rembedui_vapi_t

\par Brief Description
embedui_vapi_t defines the interface for all embedui object.
*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	
// list of all import for this package

/** \brief The interface for all embedui object
 */
public interface embedui_vapi_t {

// definition of the fields in this class


function destructor()			:void;

function update(arg	:Object)	:void;



}	// end of class 
} // end of package