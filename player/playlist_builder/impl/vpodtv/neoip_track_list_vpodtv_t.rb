#!/usr/bin/ruby
#
# \par Brief Description
# to handle a track_pool on confreaks.com

# the 'require' for the library i use
require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'impl/base/neoip_track_list_base_t'
require 'impl/confreaks/neoip_track_item_confreaks_t'

module	Neoip
module	Track_list_t
class	Vpodtv_t

# include the base of Neoip::Track_list_t
include Neoip::Track_list_t::Base_t

################################################################################
################################################################################
#			build function
################################################################################
################################################################################
def self.build(query_arg)
	# build the track_list
	track_list	= [];
	

	keywords	= query_arg['keywords']

	vpod_req	= 'SearchVideos [{"keywords":["rodrigo"],"keywordsCategories":["title","description"],"limit":null,"matchScores"' +
			':false,"order":{"desc":true,"orderBy":"UPLOAD_DATE"},"position":{"count":20,"start":0},"private":false' + 
			',"tags":[]}]';
	
	vpod_rep	= {}
	res	= Net::HTTP.new('vpod.tv', 80).start { |http|
		response	= http.request_post('/services', vpod_req)
		vpod_rep	= JSON.parse(response.body)
	}

	nb_contiguous	= [1, track_pages.length].min;
	base_idx	= track_pages.length <= nb_contiguous ? 0 : rand(track_pages.length-nb_contiguous).to_i;

	video_arr	= vpod_rep[0]['data']['videos'];	
	video_arr.each { |video|
		puts "**************"
		video_title	= video[1]['title']
		video_url	= video[1]['formats']['web'][0]['url']
		puts "'#{video_title}' at #{video_url}"	
	}


	#base_uri	= "http://mtnwestrubyconf2007.confreaks.com/"
	#base_uri	= "http://rubyhoedown2007.confreaks.com/"
	#base_uri	= "http://rejectconf4.confreaks.com/"
	#base_uri	= "http://rubyconf2007.confreaks.com/"

	base_uri	= query_arg['base_uri']
	base_doc	= Hpricot(open(base_uri))

	every_raw	= (base_doc/"table/tr")
	every_raw.shift
	track_pages	= every_raw.collect { |raw|
		begin
			(raw/"td/a")[0].attributes['href']
		rescue => e
			nil
		end
	}
	
	# delete all the ones which failed (aka the one containing nil
	track_pages.delete(nil)

	# iterate over the rss item to get the track_jspf
	nb_contiguous	= [1, track_pages.length].min;
	base_idx	= track_pages.length <= nb_contiguous ? 0 : rand(track_pages.length-nb_contiguous).to_i;
	(nb_contiguous-1).downto(0) do |i|
		track_page	= open(base_uri + track_pages[base_idx + i])
		track_html	= Hpricot(track_page)
	
		track_author	= (track_html/"span.caption")[0].inner_html
		track_title	= (track_html/"h2")[1].inner_html
		
		script_txt	= (track_html/"script")[1].inner_html
		track_content	= base_uri + script_txt.match(/file=(.*?)&/)[1]
		track_thumbnail	= base_uri + script_txt.match(/&image=(.*?)\"/)[1]

		# put this track in the track_list	
		track_item	= Neoip::Track_item_t::Vpodtv_t.new(
					{ 	"flv_uri"	=> track_content,
						"track_title"	=> track_title	});
		track_list.push( track_item );
	end
	
	# return the just built track_list
	return track_list
end

end	# end of class	Vpodtv_t
end	# end of module	Track_list_t
end	# end of module Neoip



