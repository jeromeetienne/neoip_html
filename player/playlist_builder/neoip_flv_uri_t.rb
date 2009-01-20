#!/usr/bin/ruby
#
# \par Brief Description
# Some static functions about flv_uri

# the 'require' for the library i use
require 'rubygems'
require 'mechanize'
require 'open-uri'
require 'open3'

module	Neoip
class	Flv_uri_t

################################################################################
################################################################################
#			youtube stuff
################################################################################
################################################################################

# convert a youtube video_id into its matching flv_uri
# - If there is 'explicit content', youtube require an account an age confirmation
#   - it does automatic loggin in if needed
#   - TODO the password is hardcoded in the code
#   - http://youtube.com/watch?v=NidUG88wY4o <- example of page where it is needed
def self.from_youtube_videoid(video_id)
	# init the WWW::mechanize agent
	agent		= WWW::Mechanize.new
	agent.user_agent_alias = 'Mac Safari'
	# get passed the 'age confirmation' page to reach the initial page
	html_page	= agent.get("http://youtube.com/watch?v=#{video_id}");
	
	# if this page ask for 'verify_age', if so loggin
	if( html_page.uri.to_s.match("verify_age") )
		# first login in
		login_page	= agent.click html_page.links.with.text("logging in")
		login_form	= login_page.forms.name("loginForm").first
		
		# those username/password are any user on registered on youtube 
		# - no need to be a registered developper or anything
		login_form.username = 'nonymity'
		login_form.password = 'bonjour'
		html_page	= agent.submit(login_form, login_form.buttons.first)
		# now confirm the age
		age_form	= html_page.forms[2];
		html_page	= agent.submit(age_form, age_form.buttons.first);
	end
		
	# start parsing the page to get the token
	swfarg_str	= html_page.body.match(/.*swfArgs.*/).to_s
	puts "video_id=#{video_id}"
	token		= swfarg_str.match(/\"t\":.*?\"(.*?)\"/)[1]
	temp_url	= "http://youtube.com/get_video?video_id=#{video_id}&t=#{token}"
	# TODO handle error in the command execution
	curl_cmd	= "curl -IL \"#{temp_url}\" 2>/dev/null | grep '^Location:'"
	curl_output	= `#{curl_cmd}`
	# TODO handle multiple redirection aka multiple time this line...
	flv_uri		= curl_output.match(/Location: (.*?)\r/)[1]
	# return the just found flv_uri
	return flv_uri
end

################################################################################
################################################################################
#			misc stuff
################################################################################
################################################################################

# \brief Convert a the host of a uri in a dotted-decimal ip addr
def self.convert_urihost_to_ipaddr(uri_str)
	begin
		# parse the uri
		uri		= URI.parse(uri_str);
		# get the ipaddr for the uri.host
		addr_info	= Socket::getaddrinfo(uri.host, '');
		# replace the uri.host by its ip addr in a dotted-decimal form
		uri.host	= addr_info[0][3]
		# return the result
		return uri.to_s
	rescue => e
		# if an error occurs, return the initial one
		return uri_str
	end
end

################################################################################
################################################################################
#			flv_uri_info stuff
################################################################################
################################################################################

# extract the 'base_info' from a flv_uri
# - currently the base_info are
#   - base_info.duration 	= duration of the flv_uri as in second 
#   - base_info.intmdata_len	= amount of data to be read in the file to be sure to read
#                                 the metadata. used when reading only the mdata 
def self.cpu_flv_uri_info(flv_uri)
	# init the info object
	info	= {}
	info['duration']	= nil;
	info['intmdata_len']	= nil;
	info['has_kframe_idx']	= false;
	info['file_length']	= nil;


	################ get the flv mdata of the file	########################
	# build the cmdline to run
	cmdline		 = "";
	
	# TODO to put the LD_LIBRARY path too for running the devel version of neoip-flv2xml
	#cmdline	+= "export LD_LIBRARY_PATH=/home/jerome/workspace/yavipin/build_linux:$LD_LIBRARY_PATH && "
	cmdline		+= "curl -L \"#{flv_uri}\" 2>/dev/null";
	cmdline		+= " | ";
	# this path is hardcoded to run dev version of neoip-flv2xml
	# TODO this path is hardcoded to run the dev version
	# TODO this path is hardcoded to run the dev version
	#cmdline		+= "/home/jerome/workspace/yavipin/build_linux/neoip-flv2xml"
	#cmdline		+= " -c /home/jerome/workspace/yavipin/src/config_dir_debug1";
	# this path is for the installed version of neoip-flv2xml
	cmdline		+= "neoip-flv2xml"
	
	# launch the cmdline
	stdin, stdout, stderr = Open3::popen3(cmdline)
	stdin.close
	
	# parse the output of the cmdline
begin
	while(line = stdout.readline)
		line.chomp
		# if this line contain the duration, extract it
		if line =~ /<duration>/
			info['duration']	= line.scan(/<duration>(.*)<\/duration>/)[0][0].to_f
		end
		# if this line contain the "filepositions", mark it as "has_kframe_idx"
		if line =~ /<filepositions>/
			info['has_kframe_idx']	= true;
		end
		# if this line contain a keyframe, extract it. and then leave
		if line =~ /<keyframe /
			info['intmdata_len']	= line.scan(/byte_offset=\"(.*)\"/)[0][0].to_f;
			break;
		end
	end
rescue EOFError
end
	# close all the output of command - this make the command stop
	stdout.close
	stderr.close

	################ get the length/final_uri of the file	################
	info['end_location']	= flv_uri
	cmdline			= "curl -IL \"#{flv_uri}\" 2>/dev/null";
	stdin, stdout, stderr	= Open3::popen3(cmdline)
	stdin.close
	begin
		while(line = stdout.readline)
			line.chomp
			# if this line contain the Content-Length, extract it
			if line =~ /Content-Length: /
				info['file_length']	= line.scan(/Content-Length: (.*)/)[0][0].to_i
			end
			# if this line contain the location, extract it
			if line =~ /Location: /
				info['end_location']	= line.scan(/Location: (.*)/)[0][0].strip
			end
		end
	rescue EOFError
	end
	# close all the output of command - this make the command stop
	stdout.close
	stderr.close


	# make the host of the end_location an ipaddr - good for latency
	# - TODO is this safe to do that ? i mean the host->ipaddr is a ephemeral result
	#   and this result is cached...
	# - moreover some http server requires to get a hostname e.g. youporn require it
	# - how to handle this special case ?
	# - currently disabled
	#info['end_location']	= self.convert_urihost_to_ipaddr(info['end_location'])

	################ return the just-built base_info	################
	return info;
end

# extract the 'base_info' from a flv_uri
# - currently the base_info are
#   - base_info.duration 	= duration of the flv_uri as in second 
#   - base_info.intmdata_len	= amount of data to be read in the file to be sure to read
#                                 the metadata. used when reading only the mdata 
def self.to_flv_uri_info(flv_uri)
	# determine the fullpath for the flv_mdata file
	basename_prefix	= Digest::MD5.hexdigest(flv_uri);
	basename_suffix	= "flv_uri_info";
	basename_full	= "#{basename_prefix}.#{basename_suffix}";
	cache_fname	= "#{@@cache_rootdir}/#{basename_suffix}/#{basename_full}";

	# if cache_fname exists, read the data from it
	if( File.exist?(cache_fname) )
		file_data	= File.read(cache_fname);
		flv_uri_info	= Marshal.load(file_data);
		return flv_uri_info;
	end
	
	# compute the flv_uri_info
	flv_uri_info	= self.cpu_flv_uri_info(flv_uri)
	
	# write the result into a file
	File.open(cache_fname, 'w+'){|f| f.write(Marshal.dump(flv_uri_info))}
	
	# return the result
	return flv_uri_info
end

################################################################################
################################################################################
#			global data
################################################################################
################################################################################

# define cache_rootdir - it default on "../cache"
def self.cache_rootdir;         @@cache_rootdir;        end
def self.cache_rootdir=(val)    @@cache_rootdir = val;  end
@@cache_rootdir = "../cache"

# define the extmdata_uri base 
# - change depending on the host it is running on
# - if hostname == "jmehost2", get the local developement value, else get the production value
def self.extmdata_uri_base;         @@extmdata_uri_base;        end
def self.extmdata_uri_base=(val)    @@extmdata_uri_base = val;  end
if `hostname`.chomp == "jmehost2"
	@@extmdata_uri_base	= "http://jmehost2/~jerome/neoip_html/player/cache/flv_mdata_xml";
else
	@@extmdata_uri_host	= IPSocket::getaddress('api-static.web4web.tv');
	@@extmdata_uri_base	= "http://#{@@extmdata_uri_host}/~jerome/neoip_html/player/cache/flv_mdata_xml";
end

# define the http_peersrc_uri 
# - change depending on the host it is running on
# - if hostname == "jmehost2", get the local developement value, else get the production value
def self.http_peersrc_uri;         @@http_peersrc_uri;        end
def self.http_peersrc_uri=(val)    @@http_peersrc_uri = val;  end
if `hostname`.chomp == "jmehost2"
	@@http_peersrc_uri	= "http://jmehost2.podzone.net:55001/announce";
else
	@@http_peersrc_host	= IPSocket::getaddress('bootstrap.web4web.tv');
	@@http_peersrc_uri	= "http://#{@@http_peersrc_host}:55001/announce";
end

################################################################################
################################################################################
#			external flv_mdata stuff
################################################################################
################################################################################

require "rexml/document"

# return a string containing the external flv_mdata_t for asplayer
def self.cpu_external_flv_mdata(flv_uri)
	# log to debug
	puts "cpu_external_flv_mdata: #{flv_uri}"

	# build the cmdline to run
	cmdline		 = "";
	cmdline		+= "curl -L \"#{flv_uri}\" 2>/dev/null";
	cmdline		+= " | ";
	cmdline		+= "neoip-flv2xml --custom_kframe --tag_meta 2>/dev/null";
	
	# TODO may use open3 to read it as it is produced ?
	flv2xml_out	= `#{cmdline}`
	
	# parse the flv2xml_out into xml
	xml_input_doc	= REXML::Document.new(flv2xml_out);
	xml_in		= xml_input_doc.root;
	
	# Create a empty xml output document
	xml_output_doc	= REXML::Document.new;
	xml_out		= xml_output_doc.add_element("flv_mdata"); 
	
	# put all keyframes from xml_in into xml_out
	kframe_time_arr	= []
	kframe_offs_arr	= []
	xml_in.each_element('//keyframe') { |keyframe|
		kframe_time_arr	<< keyframe.attributes['timestamp']
		kframe_offs_arr	<< keyframe.attributes['byte_offset']
	}
	kframe_elem	= xml_out.add_element("keyframes")
	kframe_elem.add_element("times").text		=  kframe_time_arr.join(", ");
	kframe_elem.add_element("filepositions").text	=  kframe_offs_arr.join(", ");
	
	# TODO this may take many element.... no good
	# - take only one, the one in the tag_meta onMetadata
	# - as example use the hypo_from_vgoogle.flv
	xml_in.each_element('//width') { |elem_in|
		elem_out	= xml_out.add_element("video_width")
		elem_out.text	= elem_in.text;
	}
	xml_in.each_element('//height') { |elem_in|
		elem_out	= xml_out.add_element("video_height")
		elem_out.text	= elem_in.text;
	}
	
	# return the xml_out
	return xml_out.to_s
end

require "digest/md5"

# try to build a external flv_mdata file and return the extmdata_info[] to it
# - if an error occurs, it return nil
def self.to_extmdata_info(flv_uri)
	# determine the fullpath for the flv_mdata file
	basename_prefix	= Digest::MD5.hexdigest(flv_uri);
	basename_suffix	= "flv_mdata_xml";
	basename_full	= "#{basename_prefix}.#{basename_suffix}";
	extmdata_path	= "#{@@cache_rootdir}/flv_mdata_xml/#{basename_full}";

	# build the extmdata_uri
	extmdata_uri	= "#{@@extmdata_uri_base}/#{basename_full}";

	# log to debug	
	#puts "extmdata_path=#{extmdata_path}"
	#puts "extmdata_uri=#{extmdata_uri}"
	
	# if the extmdata_path do not exist, create it now
	if( not File.exist?(extmdata_path) )
		# get the data of the extmdata
		extmdata_data	= self.cpu_external_flv_mdata(flv_uri)
		# write the extmdata_data into extmdata_path file
		File.open(extmdata_path, 'w+')	{ |f| f.write(extmdata_data)	}
	end
	
	# build the extmdata_info
	extmdata_info	= {}
	extmdata_info['extmdata_uri']	= extmdata_uri;
	extmdata_info['extmdata_len']	= File.size(extmdata_path);
	# return the extmdata_info 
	return extmdata_info;
end

################################################################################
################################################################################
#			to_jspf_track stuff
################################################################################
################################################################################

# build a minimal jspf track and return it
# - return nil if an error occurs
def self.to_track_jspf(flv_uri, track_title)

	if( flv_uri == nil )
		return nil;
	end

	if( track_title == nil )
		return nil;
	end

	# get the flv_mdata for this flv_uri
	flv_uri_info	= Neoip::Flv_uri_t.to_flv_uri_info(flv_uri);
	# if the duration can not be found, skip this one
	# - this is important because some video got no metadata at all
	if( flv_uri_info['duration'] == nil )
		puts "NO metadata found on #{track_title} at #{flv_uri}. skiping it"
		return nil
	end
	
	# TODO experimentation to remove any video which dont contains kframe index
	#if( flv_uri_info['has_kframe_idx'] == false )
	#	puts "no kframe_idx found on #{title} at #{flv_uri}. skipping it"
	#	return nil
	#end

	# log to debug
	puts "flv_uri=#{flv_uri} duration=#{flv_uri_info['duration']}"
	
	# build the track_jspf
	track_jspf	= {}
	track_jspf['title']	= track_title;
	track_jspf['location']	= flv_uri_info['end_location'];
	track_jspf['duration']	= (flv_uri_info['duration'] * 1000).round;
	track_jspf['meta']	= {}
	track_jspf['extension']	= {}
	
	# put the 'oload' extension
	oload	= {};
	oload['mod']				= "flv";
	oload['http_peersrc_uri']		= @@http_peersrc_uri;
	if( flv_uri_info['file_length'] )
		oload['static_filelen']	= flv_uri_info['file_length']; 
	end
	track_jspf['extension']['oload']	= oload;

	# put the flv_mdata_info extension
	flv_mdata_info	= {};
	if( flv_uri_info['has_kframe_idx'] )
		flv_mdata_info['type']		= "internal";
		flv_mdata_info['kframe_index_present']	= true;
		flv_mdata_info['intmdata_len']	= flv_uri_info['intmdata_len'];
	else
		flv_mdata_info['type']		= "external";
		flv_mdata_info['kframe_index_present']	= true;
		extmdata_info			= Neoip::Flv_uri_t.to_extmdata_info(flv_uri);
		flv_mdata_info['extmdata_uri']	= extmdata_info['extmdata_uri'];
		flv_mdata_info['extmdata_len']	= extmdata_info['extmdata_len'];
	end
	track_jspf['extension']['flv_mdata_info']	= flv_mdata_info;

	# return the track_jspf
	return track_jspf
end

end	# end of class Flv_uri_t
end	# end of module Neoip



