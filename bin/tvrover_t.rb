#!/usr/bin/ruby


require 'rubygems'
require 'mechanize'
require 'iconv'
require 'pp'

# A module to parse the tvrover.com website 
# - http://www.tvrover.com is the main url
# - http://www.tvrover.com/france/tv-france.html is a sample url for france
# 
# - GOAL: to extract url of various existing streams over the internet and restream them over neoip-casti
# - TODO this has been coded quite fast and require a lot more comment
module	Tvrover

# scrap the sidemenu of a given url
#
def self.parse_sidemenu(page_url)
	# get the html page thru mechanize
	agent	= WWW::Mechanize.new
	page	= agent.get(page_url);

	# get every line from the side menu
	sidemenu_arr	= [];
	page.search("//ul.sidemenu").search("/li/") do |item|
		# get data from this item
		menu_url	= item.attributes['href'].to_s
		menu_name	= item.inner_html.to_s
		# display to debug
		#puts "menu item #{menu_name} toward #{menu_url}"
		# append this item in the array
		sidemenu_arr << { 	"url"	=> menu_url,
					"name"	=> menu_name,
				}
	end
	# return the result
	return sidemenu_arr;
end

# scrap the sidemenu of a given url
#
# - some page like "france" got bogus table which makes this parsing wrong
#   - http://www.tvrover.com/france/tv-france.html contains a nested <tr>
#   - workedaround with a special case in the source
#
def self.parse_stream(page_url)
	# get the html page thru mechanize
	agent	= WWW::Mechanize.new
	begin
		page	= agent.get(page_url);
	rescue => e
		# NOTE: surprisingly some links are broken
		# - such as 
		puts "try to stream_scrap(#{page_url}) produced #{e}. aborting"
		return []
	end

	# get every line from the datatable
	stream_arr	= [];
	tr_arr		= page.search("//table.datatable/tr");
	# NOTE: france page contains bogus html. with tr inside tr
	# - this line is only made to workaround this case
	if page_url == "http://www.tvrover.com/france/tv-france.html"
		tr_arr		+=page.search("//table.datatable/tr/tr")
	end
	tr_arr.each do |item|
		# get all the <td> from this row
		td_arr	= item.search("/td/")
		
		# if this is not a data row, goto the next
		next unless td_arr.length == 3
		
		# the link_type is either "Stream" or "Web Site"
		link_type	= td_arr[1].inner_html;
		# skip this row unless link_type == "Stream"
		next unless link_type == "Stream"
	
		# get data from this item	
		human_name	= td_arr[0].to_s;
		stream_uri	= td_arr[1].attributes['href'].to_s;
		comment		= td_arr[2].to_s;
		
		# some of the input is in a bugged
		# - discarding the whole sentence it not nice degradation... find better
		# - TODO removing only the bad characteres would be better
		human_name	= Iconv.conv('iso-8859-1', 'utf8', human_name) rescue "utf8 bugged"
		comment		= Iconv.conv('iso-8859-1', 'utf8', comment) rescue "utf8 bugged"
		# display to debug
		#puts "#{human_name} / #{comment} / #{stream_uri}"
	
		# append this item in the array
		stream_arr << { 	"human_name"	=> human_name,
					"stream_uri"	=> stream_uri,
					"comment"	=> comment,
				}
	end
	# return the just-built stream_arr
	return stream_arr;
end


# parse a given page and return the result
#
def self.parse_onepage(location, page_url)
	puts "process location #{location}"
	
	# get all the stream from this page
	stream_arr	= self.parse_stream(page_url);
	# add the "location" field of each of those streams
	stream_arr.each{ |item| item['location'] = location }
	
	# go scrap deeper if it is ok
	location_deeper_ok	= ["world", "world/USA"];
	if location_deeper_ok.include?(location)
		sidemenu_arr	= self.parse_sidemenu(page_url);
		sidemenu_arr.each { |sidemenu_item|
			sub_location	= location + "/" + sidemenu_item['name'];
			sub_stream_arr	= parse_onepage(sub_location, "http://www.tvrover.com" + sidemenu_item['url'])
			sub_stream_arr.each{ |item| item['location'] = sub_location }
			stream_arr	+= sub_stream_arr;
		}
	end
	# return the just-built geonode
	return stream_arr;	
end

# parse the whole site, starting by the root and return the result
def self.parse_allpage()
	return parse_onepage("world", "http://www.tvrover.com");
end

end	# end of module Tvrover
