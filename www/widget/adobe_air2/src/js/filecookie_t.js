/*
 * - TODO find a better name for this class
 * - this class is mainly used for working around the lack of
 *   cookie for app:/ document
 * - NOTE: you MUST not instantiate multiple objects on the same files
 *   - this object contains a local copy of the store.
 *   - several objects would desync/duplicate copies
*/
var filecookie_t = function(filename){
	// define the filename if needed
	filename	= filename || "filecookie.store.json";
	var myfile	= air.File.applicationStorageDirectory.resolvePath(filename);
	var store	= {}
	// TODO read the file from the disk
	
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
	var writeFile	= function(){
		var str	= $.toJSON(store);
		var fs	= new air.FileStream();
		fs.open(myfile, air.FileMode.WRITE);
		fs.writeUTFBytes(str);
		fs.close();
	}


	var get		= function(key){
		return store[key];
	}
	var set		= function(key, val){
		store[key]	= val;
		writeFile();
	}
	var has		= function(key){
		return store[key] !== undefined;	
	}
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