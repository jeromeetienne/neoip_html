#!/usr/bin/ruby
#
# - TODO to document

require 'rubygems'
require 'net/http'
require 'xmlsimple'
require 'cgi'

################################################################################
################################################################################
#			class Youtube_gdata_t
################################################################################
################################################################################

# \brief ruby binding for the gdata interface of youtube
# - for defails see http://code.google.com/apis/youtube/reference.html
class	Youtube_gdata_t

class Stdfeedid	# list found in http://code.google.com/apis/youtube/reference.html
	TOP_RATED		= "top_rated"
	TOP_FAVORITES		= "top_favorites"
	MOST_VIEWED		= "most_viewed"
	MOST_DISCUSSED		= "most_discussed"
	MOST_LINKED		= "most_linked"
	MOST_RESPONDED		= "most_responded"
	RECENTLY_FEATURED	= "recently_featured"
	WATCH_ON_MOBILE		= "watch_on_mobile"
end

#!\brief Build the query_uri to query youtube gdata
def self.build_query_uri(arg)
	# get the parameter from the arg
	feed_type	= arg['feed_type']
	category_tag	= arg['category_tag']
	query_param	= arg['query_param']
	
	# initialize the query_uri
	query_uri	= "http://gdata.youtube.com/feeds/api";

	# append the feed_type according to arg['type']
	case arg['type']
		when "users"
			query_uri	+= "/#{arg['type']}/#{arg['username']}"
			if arg['subtype']
				query_uri	+= "/#{arg['subtype']}"
			end
		when "standardfeeds"
			query_uri	+= "/#{arg['type']}/#{arg['feed_id']}"
		when "playlists"
			query_uri	+= "/#{arg['type']}/#{arg['playlist_id']}"
		when "videos"
			query_uri	+= "/#{arg['type']}"
		when "related"
			query_uri	+= "/#{arg['video_id']}/#{arg['type']}"
	end
	
	# appends the category_tag to the query_uri
	if( category_tag && category_tag.length > 0)
		query_uri	+= "/-"
		category_tag.each { |x| query_uri += "/#{CGI.escape(x.to_s)}"	}
	end
	
	# appends the category_tag to the query_uri
	if( query_param )
		query_str	= ""
		query_param.each_pair { |k, v| query_str << "&#{k.to_s}=#{CGI.escape(v.to_s)}" }
		query_str[0]	= '?'
		query_uri	+= query_str;
	end
	
	# return the just-build query_uri
	return query_uri
end

# \brief Do a query 
def self.query(arg)
	# build the query_uri
	query_uri	= self.build_query_uri(arg);
	# get the xml_data
	xml_data	= Net::HTTP.get_response(URI.parse(query_uri)).body.to_s
	# parse the xml to make it ruby struct
	result		= XmlSimple.xml_in(xml_data)
	# return the obtained result
	return result
end

# \brief Retrieve the category list
def self.category_list()
	uri		= "http://gdata.youtube.com/schemas/2007/categories.cat"
	xml_data	= Net::HTTP.get_response(URI.parse(uri)).body.to_s
	data		= XmlSimple.xml_in(xml_data)
	result		= []
	data['category'].each { |category|
		result.push({ 	"id"	=> category['term'],
				"title"	=> category['label']	})
	}
	return result;
end

end	# end of class	Youtube_gdata_t


