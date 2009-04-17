// extract all configuration options from the document URI
// - this is ok as it is suppposed to be used as iframe
var urivar_arr	= neoip.core.doc_urivar_arr();
var cfgvar_arr	= {}
for(var key in urivar_arr){
	// goto the next if not prefixed by "neoip_var_"
	if( /^neoip_var_/.test(key) == false )	continue;
	// remove the prefix from the key
	stripped_key	= /^neoip_var_(.*)/.exec(key)[1]
	// copy the value in cfgvar_arr
	cfgvar_arr[stripped_key]	= urivar_arr[key];
}

// build the neoip.ezplayer_t
var ezplayer	= new neoip.ezplayer_t(cfgvar_arr);
// set the server_date in ezplayer
ezplayer.set_server_date( parseFloat(neoip.core.download_file_insync("../../cgi-bin/server_date.php", true))*1000 );

// if the uri contains a 'playlist_id' variable, use it to load this playlist
// - additionnaly dont put a playlist_arr, so impossible to change channel
var	playlist_id	= "";
if( playlist_id != ""){
	var	playlist_url	= "../../cgi-bin/get_playlist.rb?playlist_id=" + playlist_id;
	ezplayer.change_playlist(playlist_url);
}else{
	ezplayer.load_plistarr("../cache/ezplayer_playlist_arr.json");
}
// start the ezplayer_t	
ezplayer.start();


/************************************************************************/
/*		handle a API with crossframe library 			*/
/************************************************************************/
var rpc_server	= crossframe.rpc_server_t({
	listener_obj:	"crossframe_msg"
});
rpc_server.register("playing_start", function(){
	console.info("rpc_server playing start");
	ezplayer.playing_start();
});
rpc_server.register("playing_stop", function(){
	console.info("rpc_server playing stop");
	ezplayer.playing_stop();
});
