/**
 * @class filecookie_t
 * 
 * - TODO find a better name for this class
 * - this class is mainly used for working around the lack of
 *   cookie for app:/ document
 * - NOTE: you MUST not instantiate multiple objects on the same file
 *   - this object contains a local copy of the store.
 *   - several objects would desync/duplicate copies
*/
var filecookie_t = function(filename){
	// define the filename if needed
	filename	= filename || "filecookie.store.json";
	var myfile	= air.File.applicationStorageDirectory.resolvePath(filename);
	var store	= {}
	// TODO read the file from the disk
	
	/**
	 * read the file on the disk
	 * @private
	*/
	var readFile	= function(){
		// if this file doesnt exist, return now
		if( !myfile.exists )	return;
		var fs	= new air.FileStream();
		fs.open(myfile, air.FileMode.READ);
		var json_str	= fs.readUTFBytes(fs.bytesAvailable);
		fs.close();
		air.trace('json_str='+json_str);
		store	= $.evalJSON(json_str);
	}
	/**
	 * Write the file on the disk
	 * @private
	 */
	var writeFile	= function(){
		var str	= $.toJSON(store);
		var fs	= new air.FileStream();
		fs.open(myfile, air.FileMode.WRITE);
		fs.writeUTFBytes(str);
		fs.close();
	}


	/**
	 * get a property in the store
	 * @param key {string} the key of the property
	 * @returns {mixed} the property value 
	*/
	var get		= function(key){
		return store[key];
	}
	/**
	 * Set a property value in the store
	 * - the file is written immediatly after that
	 * @param key {string} the key of the property
	 * @param val {mixed} the value of the property
	*/
	var set		= function(key, val){
		store[key]	= val;
		writeFile();
	}
	/**
	 * test if a property exist in the store
	 * @returns {boolean} true if the property exists, false otherwise
	*/
	var has		= function(key){
		return store[key] !== undefined;	
	}
	/**
	 * remove a property from the store
	 * - the file is written immediatly after that
	 * @param key {string} the key of the property
	*/
	var del		= function(key){
		delete store[key];
		writeFile();
	}
	
	// read the file from disk during constructor
	readFile();
	// return public functions and variables
	return {
		get:	get,
		set:	set,
		del:	del,
		has:	has
	};
}
