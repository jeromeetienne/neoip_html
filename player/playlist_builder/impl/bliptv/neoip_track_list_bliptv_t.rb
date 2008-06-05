#!/usr/bin/ruby
#
# \par Brief Description
# to handle a track_pool on blip.tv

# the 'require' for the library i use
require 'impl/base/neoip_track_list_base_t'
require 'impl/bliptv/bliptv_t'
require 'impl/bliptv/neoip_track_item_bliptv_t'


module	Neoip
module	Track_list_t
class	Bliptv_t

# include the base of Neoip::Track_list_t
include Neoip::Track_list_t::Base_t

################################################################################
################################################################################
#			build function
################################################################################
################################################################################
def self.build(p_query_arg)

	# do a deep copy of query_arg - to be able to modify it 
	query_arg	= Marshal::load(Marshal.dump(p_query_arg));  

	query_arg['pagelen']	= 100;

	###
	# NOTE: blip.tv API doesnt provide the total_results of a query
	# - to workaround, the algo is the following
	# 1. draw a page number at random between 1 and 10
	# 2. query this page
	# 3. if this page contains items, use this one
	# 4. if page is 1, this query has no item at all, throw an exception
	# 5. divide page/2 and loop on step 2 
	###

	# draw the initial page number at random
	page		= 1 + rand(10);
	# loop querying decreasing page number until one return items 
	while true
		puts "page=#{page}"
		# set the page for this query
		query_arg['page']	= page;
		# do the query
		query_result	= ::Bliptv::query_data(query_arg);

		# put all the video entries into item_arr
		item_arr	= query_result['channel'][0]['item'];
		
		# if this query returns items, leave the loop now
		break	if not item_arr.nil?
		# if this query was on page 1, impossible to get another page, return now
		break	if page == 1
		
		# divide page by 2 to keep randomness while reducing the page number
		page	/= 2;
	end
	
	if item_arr.nil?
		throw "no item";
	end
	
	puts( "item_arr.length=#{item_arr.length}");
	
	# build the track_list
	# - this is an array containing a Neoip::Track_item_t::Blitv_t for each item
	track_list	= [];
	item_arr.each_with_index { |item, index|
		track_title	= item['title'][0]
		puts "index=#{index}"
		puts "track_title=#{track_title}"
		content_flv_arr	= [item['group'][0]['content']].flatten.select { |content|
					content['type'] == "video/x-flv"
				};
		pp content_flv_arr
		next if content_flv_arr.empty?
		flv_uri		= content_flv_arr[0]['url']

		track_arg	= { 	"title"		=> track_title,
					"flv_uri"	=> flv_uri	};

		track_item	= Neoip::Track_item_t::Bliptv_t.new(track_arg);
		track_list.push( track_item );
	}
	# return the just built track_list
	return track_list
end

end	# end of class	BlipTV
end	# end of module Track_list_t
end	# end of module Neoip



