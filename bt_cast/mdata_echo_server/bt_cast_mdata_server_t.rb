#!/usr/bin/ruby
#
# \par Brief Description
# Some function to handle the bt_cast_mdata_t publication
#
# \par TODO
# - TODO handle the creation of playlist_jspf for those cast_mdata
#   - using the same stuff as playlist_builder ?
#   - seems harder at first but clearly much cleaner
# - TODO handle the creation of a plistarr.json for those playlist
# - TODO remove the xmlrpc exception sent here
#   - put normal exception
#   - in xmlrpc front, convert those exception into xmlrpc one

require 'rubygems'
require 'json'
require "xmlrpc/client"
require 'fileutils'
require File.join(File.dirname(__FILE__), '../../player/playlist_builder/neoip_playlist_t')
require File.join(File.dirname(__FILE__), '../../player/playlist_builder/neoip_plistarr_builder_t')


module	Neoip
class	Cast_mdata_server_t

# define from variables on the various dirname/filename
def self.root_dirname();	return "/tmp/.neoip_cast_mdata_server_data";		end
def self.ctxfile_dirname();	return "#{self.root_dirname}/cast_ctxfile";		end
def self.playlist_dirname();	return "#{self.root_dirname}/playlist_jspf";		end
def self.plist_arr_filename();	return "#{self.root_dirname}/ezplayer_playlist_arr.json";end
def self.log_filename();	return "#{self.root_dirname}/cast_mdata_server.log";	end

################################################################################
################################################################################
#			Logging function
################################################################################
################################################################################

def self.log_error(str)
	require 'logger'
	logger = Logger.new(self.log_filename)
	logger.info "#{str}"
end

################################################################################
################################################################################
#			handle ctxfile
################################################################################
################################################################################

def self.create_dir_ifneeded()
	FileUtils::mkdir_p(self.root_dirname)		unless File.exist?(self.root_dirname);
	FileUtils::mkdir_p(self.ctxfile_dirname)	unless File.exist?(self.ctxfile_dirname);
	FileUtils::mkdir_p(self.playlist_dirname)	unless File.exist?(self.playlist_dirname);
	
	
	# create a playlist file specific for 'not_found'
	# - TODO should be created only once
	self.playlist_file_put("none", "not_found_cast_privhash")
	# generate the plistarr
	self.plistarr_file_put()
end

def self.ctxfile_name(cast_name, cast_privhash)
	basename	= "#{cast_name}_#{cast_privhash}";
	fullname	= "#{self.ctxfile_dirname}/#{basename}";
	return fullname;
end

def self.ctxfile_write(cast_name, cast_privhash, cast_ctx)
	file_name	= self.ctxfile_name(cast_name, cast_privhash)
	File.open(file_name, 'w+'){|f| f.write(Marshal.dump(cast_ctx))}
end
def self.ctxfile_read(cast_name, cast_privhash)
	file_name	= self.ctxfile_name(cast_name, cast_privhash)
	file_data	= File.read(file_name);
	cast_ctx	= Marshal.load(file_data);
	return cast_ctx;
end
def self.ctxfile_exist?(cast_name, cast_privhash)
	file_name	= self.ctxfile_name(cast_name, cast_privhash)
	return File.exist?(file_name)
end
def self.ctxfile_delete(cast_name, cast_privhash)
	file_name	= self.ctxfile_name(cast_name, cast_privhash)
	File.delete(file_name)
end
def self.ctxfile_age(cast_name, cast_privhash)
	file_name	= self.ctxfile_name(cast_name, cast_privhash)
	return Time.now - File.mtime(file_name)
end

################################################################################
################################################################################
#			misc
################################################################################
################################################################################
def self.cast_privtext2hash(cast_privtext)
	# only to produce the cast_privhash - NOTE: rather heavy no ? - well do fastcgi
	require 'digest/sha1'
	return Digest::SHA1.hexdigest(cast_privtext)[0..7];
end

################################################################################
################################################################################
#			set_cast_mdata
################################################################################
################################################################################

# \brief xmlrpc function to publish a cast_mdata in pull mode
#
def self.set_cast_mdata_pull(cast_name, cast_privtext, cast_id, port_lview, port_pview,
						uri_pathquery, remote_addr_str)
	log_error "function=set_cast_mdata_pull"
	log_error "cast_name=#{cast_name} cast_privtext=#{cast_privtext}."
	log_error "port_lview=#{port_lview} port_pview=#{port_pview} uri_pathquery=#{uri_pathquery}"

	# compute the cast_privhash from the cast_privtext
	cast_privhash	= self.cast_privtext2hash(cast_privtext);

	# determine if this ctxfile existed before - to know if it is a refresh or a creation
	# - TODO is there issue with obsolete ctxfile ? or pull/push change ?
	ctxfile_existed	= self.ctxfile_exist?(cast_name, cast_privhash);

	require	'ipaddr'
	remote_addr	= IPAddr.new( remote_addr_str );

	# determine the $chosen_port depending on the remote_addr of rfc1918
	addr_is_public	= remote_addr.mask(8).to_s != "10.0.0.0" &&
				remote_addr.mask(12).to_s	!= "172.16.0.0"  &&
				remote_addr.mask(16).to_s	!= "192.168.0.0" &&
				remote_addr.mask(8).to_s	!= "127.0.0.0";
	port_chosen	= addr_is_public ? port_pview : port_lview;
	
	# build casti_srv_uri
	casti_srv_uri	= "http://#{remote_addr}:#{port_chosen}#{uri_pathquery}";
	
	log_error("cati_srv_uri=#{casti_srv_uri}");
	
	# build the cast_ctx
	cast_ctx	= {}
	cast_ctx['cast_name']	= cast_name;
	cast_ctx['cast_id']	= cast_id;
	cast_ctx['ctx_type']	= "pull";
	cast_ctx['ctx_arg']	= casti_srv_uri;

	# write the cast_ctx in a file
	self.ctxfile_write(cast_name, cast_privhash, cast_ctx);

	# call the hook_cast_created if needed
#	self.hook_cast_created(cast_name, cast_privhash)	unless ctxfile_existed;
	self.hook_cast_created(cast_name, cast_privhash);
	
	# return the cast_privhash
	return cast_privhash;
end

# \brief xmlrpc function to publish a cast_mdata in push mode
#
def self.set_cast_mdata_push(cast_name, cast_privtext, cast_mdata)
	log_error "function=set_cast_mdata_push"
	log_error "cast_name=#{cast_name} cast_privtext=#{cast_privtext}."
	log_error "cast_mdata=#{cast_mdata.inspect}."
	
	log_error	File.join(File.dirname(__FILE__), 'bt_cast_mdata_server_t')

	# compute the cast_privhash from the cast_privtext
	cast_privhash	= self.cast_privtext2hash(cast_privtext);
	
	# build the cast_ctx
	cast_ctx	= {}
	cast_ctx['cast_name']	= cast_name;
	cast_ctx['ctx_type']	= "push";
	cast_ctx['ctx_arg']	= cast_mdata;

	# determine if this ctxfile existed before - to know if it is a refresh or a creation
	# - TODO is there issue with obsolete ctxfile ? or pull/push change ?
	ctxfile_existed	= self.ctxfile_exist?(cast_name, cast_privhash);
	# TODO fix it. this is an optimization to avoid creating at each refresh too
	# - some issue
	#ctxfile_existed	= false;

	# write the cast_ctx in a file
	self.ctxfile_write(cast_name, cast_privhash, cast_ctx);
	
	# call the hook_cast_created if needed
#	self.hook_cast_created(cast_name, cast_privhash)	unless ctxfile_existed;
	self.hook_cast_created(cast_name, cast_privhash);
	
	# return the cast_privhash
	return cast_privhash;
end

################################################################################
################################################################################
#			get_cast_mdata
################################################################################
################################################################################

# \brief xmlrpc function to retrieve a cast_mdata
#
def self.get_cast_mdata(cast_name, cast_privhash)
	# if the ctxfile_file doesnt exist, return an error
	if( !self.ctxfile_exist?(cast_name, cast_privhash) )
		raise XMLRPC::FaultException.new(-1, "stream #{cast_name} with hash #{cast_privhash} doesnt exist.")
	end
	
	# get the cast_ctx itself
	cast_ctx	= self.ctxfile_read(cast_name, cast_privhash);
	
	# forward to the proper handler depending on cast_ctx['ctx_type']
	if( cast_ctx['ctx_type'] == "pull" )
		return self.get_cast_mdata_pull(cast_name, cast_privhash, cast_ctx);
	else
		return self.get_cast_mdata_push(cast_name, cast_privhash, cast_ctx);
	end
end

# \brief get_cast_mdata implementation in pull mode
#
def self.get_cast_mdata_pull(cast_name, cast_privhash, cast_ctx)
	# get casti_srv_uri/cast_id from cast_ctx['ctx_arg']
	casti_srv_uri	= cast_ctx['ctx_arg'];
	cast_id		= cast_ctx['cast_id'];

	# create the xmlrpc_client to forward the xmlrpc call to neoip-casti directly	
	xmlrpc_client = XMLRPC::Client.new2(casti_srv_uri);
	begin
		cast_mdata	= xmlrpc_client.call("get_cast_mdata", cast_id, cast_privhash);
	rescue => e;
		# if the exception is a xmlrpc fault from neoip-casti, just forward it
		# - else return a 'custom' xmlrpc fault
		if( e.class != XMLRPC::FaultException )
			raise XMLRPC::FaultException.new(e.faultCode, e.faultString)
		else
			raise XMLRPC::FaultException.new(-1, "Error #{e.to_s}")
		end
	end

	# return the cast_mdata
	return cast_mdata;
end

# \brief get_cast_mdata implementation in push mode
#
def self.get_cast_mdata_push(cast_name, cast_privhash, cast_ctx)
	# if ctx_age is too old, delete the ctxfile and return an error
	# - TODO make this delay tunable
	ctx_age		= self.ctxfile_age(cast_name, cast_privhash);
	if( ctx_age > 60 )
		ctxfile_delete(cast_name);
		raise XMLRPC::FaultException.new(-1, "stream #{cast_name} (hash=#{cast_privhash}) is obsolete.")
	end
	
	# get cast_mdata from cast_ctx['ctx_arg']
	cast_mdata	= cast_ctx['ctx_arg'];
	
	# attempts to update the casti_date
	cast_mdata['casti_date'] += ctx_age;
	
	# return the cast_mdata
	return cast_mdata;
end

################################################################################
################################################################################
#			del_cast_mdata
################################################################################
################################################################################

# \brief xmlrpc function to delete a cast_mdata
#
def self.del_cast_mdata(cast_name, cast_privtext)
	log_error "function=del_cast_mdata"
	log_error "cast_name=#{cast_name} cast_privtext=#{cast_privtext}."
	# delete the ctxfile
	cast_privhash	= cast_privtext2hash(cast_privtext);
	self.ctxfile_delete(cast_name, cast_privhash);
	
	# call the hook_cast_deleted
	self.hook_cast_deleted(cast_name, cast_privhash);
	
	# return 0 - all the time
	return 0;
end

################################################################################
################################################################################
#
################################################################################
################################################################################

# hook called every time a cast is created
def self.hook_cast_created(cast_name, cast_privhash)
	# create the playlist file
	self.playlist_file_put(cast_name, cast_privhash)
	# regenerate the plistarr
	self.plistarr_file_put()
end

# hook called every time a cast is deleted
def self.hook_cast_deleted(cast_name, cast_privhash)
	# delete the playlist file
	self.playlist_file_del(cast_name, cast_privhash)
	# regenerate the plistarr
	self.plistarr_file_put()
end

################################################################################
################################################################################
#			playlist_jspf stuff
################################################################################
################################################################################

# define the mdata_srv_uri base 
# - change depending on the host it is running on
# - if hostname == "jmehost2", get the local developement value, else get the production value
def self.mdata_srv_uri_base;         @@mdata_srv_uri_base;        end
def self.mdata_srv_uri_base=(val)    @@mdata_srv_uri_base = val;  end
if `hostname`.chomp == "jmehost2"
	@@mdata_srv_uri_base	= "http://jmehost2/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.fcgi";
else
	@@mdata_srv_ipaddr	= IPSocket::getaddress('sd-14474.dedibox.fr');
	@@mdata_srv_uri_base	= "http://#{@@mdata_srv_ipaddr}/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.fcgi";
end

# return a filename where this playlist to put/get this playlist
def self.playlist_filename(cast_name, cast_privhash)
	basename	= "#{cast_name}_#{cast_privhash}.playlist_jspf";
	fullname	= "#{self.playlist_dirname}/#{basename}";
	return fullname;
end




# BARCAMP KLUDGE BEG
# - use a reverse proxy on player.web4web.tv to export neoip-casto stream
# - it allow people without webpack
# - it is done on port 80 so should be web proxy compliant
def self.cast_name_to_location(cast_name, cast_privhash)
	location_url	= "http://player.web4web.tv/direct_stream/"
	location_url	+="#{cast_privhash}/#{cast_name}"
	location_url	+="?mdata_srv_uri=http%3A//88.191.76.230/%7Ejerome/neoip_html/cgi-bin/cast_mdata_echo_server.fcgi"
	return location_url
end
# BARCAMP KLUDGE END

# build a Neoip.Playlist_t for this cast_name/cast_privhash
def self.playlist_build(cast_name, cast_privhash)
	playlist	= Neoip::Playlist_t.new
	playlist.jspf['date']		= Time.now.gmtime.to_s;
	playlist.jspf['title']		= cast_name;
	playlist.jspf['identifier']	= "#{cast_name}_#{cast_privhash}";
# BARCAMP KLUDGE BEG - to make casto not mandatory
# orig-	playlist.jspf['extension']	= { "external_dep"	=> { "casto"	=> { "required"	=> true	}}};
	playlist.jspf['extension']	= { "external_dep"	=> { "casto"	=> { "required"	=> false	}}};
# BARCAMP KLUDGE END

	track_jspf	= {}
	track_jspf['title']	= cast_name;
# BARCAMP KLUDGE BEG - listen on sd-14474.dedibox.fr public ip addr to allow direct read
# orig-	track_jspf['location']	= "http://example.com/dummy";
	track_jspf['location']	= self.cast_name_to_location(cast_name, cast_privhash);
# BARCAMP KLUDGE END
	track_jspf['duration']	= 8852000;
	track_jspf['meta']	= { "content_type"	=> "stream" };
	track_jspf['extension']			= {};
	track_jspf['extension']['casto']	= {};
	extcasto_jspf	= {};
	extcasto_jspf['cast_name']	= cast_name;
	extcasto_jspf['cast_privhash']	= cast_privhash;
	extcasto_jspf['mdata_srv_uri']	= "#{@@mdata_srv_uri_base}";
	track_jspf['extension']['casto']= extcasto_jspf;

	playlist.jspf['track']	= [track_jspf];
	
	return playlist;
end

def self.playlist_file_put(cast_name, cast_privhash)
	playlist	= self.playlist_build(cast_name, cast_privhash)
	playlist_fname	= self.playlist_filename(cast_name, cast_privhash);
	playlist.to_file(playlist_fname)
end

def self.playlist_file_del(cast_name, cast_privhash)
	playlist_fname	= self.playlist_filename(cast_name, cast_privhash);
	File.delete(playlist_fname)
end

################################################################################
################################################################################
#			plistarr stuff
################################################################################
################################################################################

# put a plistarr file for all the current cast
def self.plistarr_file_put()
	# get the list of playlist_jspf filename
	fname_arr	= Dir.glob("#{self.playlist_dirname}/*.playlist_jspf").sort
	
	# remove all playlist_jspf older than a threshold (currently 5*60-sec)
	fname_arr.collect! { |fname|
		# get the age of the file
		file_age_sec	= Time.now - File.mtime(fname)
		# delete the file to be cleaner
		#File.delete(fname) if file_age_sec <= 5*60
		# remove it from fname_arr
		file_age_sec <= 5*60 ? fname : nil 
	}.compact!
	
	# handle the case of no playlist at all.
	# - fname_arr contains playlist for not_found, so if it is not the only playlist
	#   remove it. else keep it 
	if fname_arr.length > 1
		 fname_arr.collect!{ |fname| fname == self.playlist_filename("none", "not_found_cast_privhash") ?
		 			 nil : fname}.compact!
	end
	# convert it to the proper url
	uri_arr		= fname_arr.collect{ |fname|
					basename	= File.basename(fname);
					"../../cgi-bin/cast_get_playlist.fcgi?basename=#{basename}"
				}

	# build the Neoip::Plistarr_builder_t
	plistarr_builder	= Neoip::Plistarr_builder_t.new
	# populate plistarr_builder.list_arr with fname_arr/uri_arr
	for i in (0..uri_arr.length-1)
		plistarr_builder.list_arr << { 	"filename"	=> fname_arr[i],
						"uri"		=> uri_arr[i]	}
	end
	# save the plistarr file
	plistarr_builder.to_file(self.plist_arr_filename);
end

end	# end of class Cast_mdata_server_t
end	# end of module Neoip



