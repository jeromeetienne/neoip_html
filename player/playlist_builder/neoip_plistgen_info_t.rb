#!/usr/bin/ruby
#
# \par Brief Description
# to handle a plistgen_info

# the 'require' for the library i use
require 'rubygems'
require 'json'


module	Neoip
class	Plistgen_info_t

attr_accessor	:json_data	# object which will hold all the data

################################################################################
################################################################################
#			constructor
################################################################################
################################################################################
def initialize()
	json_data	= {}
end


################################################################################
################################################################################
#			query function
################################################################################
################################################################################

# return the playlist_id from plistgen_info
def playlist_id;	return @json_data['playlist_id'];	end
# return the playlist_title from plistgen_info
def playlist_title;	return @json_data['playlist_title'];	end
# return the trackgen_info from plistgen_info
def trackgen_info;	return @json_data['trackgen_info'];	end
# return the external_dep from plistgen_info
def external_dep;	return @json_data['external_dep'];	end

################################################################################
################################################################################
#			from_file/to_file
################################################################################
################################################################################

# create a playlist from a file (supposed to be in jspf - json version of xspf)
def self.from_file(filename)
	# read the file
	file_data		= File.read(filename);
	# parse it as json
	json_data		= JSON.parse(file_data);
	# build a playlist with the json_data
	plistgen_info		= Neoip::Plistgen_info_t.new();
	plistgen_info.json_data	= json_data;
	# return the just-built Plistgen_info_t
	return plistgen_info;
end

# save the current Playgen_info_t to a filename
def to_file(filename)
	data2write	= JSON.pretty_generate(@json_data);
	File.open(filename, 'w+'){|f| f.write(data2write)}
end

end	# end of class Plistgen_info_t
end	# end of module Neoip



