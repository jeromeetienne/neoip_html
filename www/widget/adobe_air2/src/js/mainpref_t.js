var mainpref_t	= function(){
	var filecookie		= new filecookie_t("filecookie_mainpref.store.json");
	var PrefsDefault	= {
		'start_at_login':	true
	}
	// ensure all the preferences are set in filecookie
	for(var key in PrefsDefault){
		if( filecookie.has('pref_'+key))	continue;
		filecookie.set("pref_"+key, PrefsDefault[key]);
	}


	var hasKey	= function(key){
		return filecookie.has("pref_"+key);
	};
	var set		= function(key, val){
		var val_changed	= filecookie.get(key) != val;
		air.trace("setting key=" + key + " to value=" + val);
		// store the preference in filecookie
		filecookie.set("pref_"+key, val);
		
		// now make it effective
		if( key == "start_at_login" ){
			// set the startAtLogin - it is known to fails thru adl
			if( RunningThruAdl() )	return;
			var nativeApp		= air.NativeApplication.nativeApplication;
			nativeApp.startAtLogin	= filecookie.get("pref_"+ key);
		}
	};
	var get		= function(key){
		return filecookie.get('pref_'+key);
	};
	var getDfl	= function(key){
		return PrefsDefault[key];
	}
	
	// ensure start_at_login is updated 
	set("start_at_login", get("start_at_login"));
	// return public functions and variables	
	return {
		hasKey:	hasKey,
		set:	set,
		get:	get,
		getDfl:	getDfl
	}
};