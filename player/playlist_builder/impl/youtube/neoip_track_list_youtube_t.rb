#!/usr/bin/ruby
#
# \par Brief Description
# to handle a track_pool on blip.tv


# the 'require' for the library i use
require 'impl/youtube/youtube_gdata_t.rb'
require 'impl/base/neoip_track_list_base_t'
require 'impl/youtube/neoip_track_item_youtube_t'

module	Neoip
module	Track_list_t
class	Youtube_t

# include the base of Neoip::Track_list_t
include Neoip::Track_list_t::Base_t

################################################################################
################################################################################
#			build function
################################################################################
################################################################################
def self.build(p_query_arg)
	# build the track_list
	track_list	= [];

	# do a deep copy of query_arg - to be able to modify it 
	# - this is required to query the total_results before the actual query 
	query_arg	= Marshal::load(Marshal.dump(p_query_arg));  
	
	# perform a first dummy query to get the "total_results"
	query_arg['query_param']		||= {}; 
	query_arg['query_param']['start-index']	= 1;
	query_arg['query_param']['max-results']	= 1;
	query_result	= Youtube_gdata_t.query(query_arg);
	total_results	= query_result['totalResults'][0].to_i;
	# bound the total_result to max query_arg['select_first']
	select_first	= query_arg['select_first'] || 1000;
	total_results	= [select_first, total_results].min;

	# compute nb_contiguous and start_index
	nb_contiguous	= 50;
	nb_contiguous	= [nb_contiguous, total_results].min;
	start_index	= total_results <= nb_contiguous ? 0 : rand(total_results-nb_contiguous).to_i;
	start_index	+= 1;
	
	# query nb_contiguous element from the start_index
	query_arg['query_param']['start-index']	= start_index;
	query_arg['query_param']['max-results']	= nb_contiguous;
	query_result	= Youtube_gdata_t.query(query_arg);
	
	# put all the video entries into entry_arr
	entry_arr	= query_result['entry'];
	
	puts( "entry_arr.length=#{entry_arr.length}");
	
	# build the track_list
	# - this is an array containing a Neoip::Track_item_t::Youtube for each rss_item
	track_list	= [];
	entry_arr.each { |entry|
		track_title	= entry['title'][0]['content']
		video_id	= entry['id'][0].split(/\//).last
		
		track_arg	= { 	"title"	=> track_title,
					"id"	=> video_id	};

		track_item	= Neoip::Track_item_t::Youtube_t.new(track_arg);
		track_list.push( track_item );
	}

	# return the just built track_list
	return track_list
end


end	# end of class	Youtube_t
end	# end of module Track_list_t
end	# end of module Neoip



