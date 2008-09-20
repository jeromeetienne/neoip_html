#!/usr/bin/ruby
#
# \par Brief Description
# Script to generate an instance of neoip_webpack_badge PNGs from a svg template
# - this is very raw


## \brief Generate a png of neoip-webpack badge for a given state and size
def generate_png(state, size_str)
	svg_fname	= "neoip_webpack_badge.svg";
	tmp_fname	= "/tmp/.webpack_badge_generator.tmp";
	png_fname	= "cache/neoip_webpack_badge_#{state}_#{size_str}.png";
	if( state == "inprobing" )
		state_str	= "probing..";
		color_str	= "blue";
	elsif( state == "toinstall" )
		state_str	= "Install";
		color_str	= "red";
	elsif( state == "toupgrade" )
		state_str	= "Upgrade";
		color_str	= "orange";
	elsif( state == "installed" )
		state_str	= "Installed";
		color_str	= "green";
	else
		state_str	= "BOGUSSSSSS";
		color_str	= "blue";
	end

	# generate the svg suitable for state_str and size_str
	svg_data	= File.open("#{svg_fname}").read
	svg_data.gsub!(/Probing/	, "#{state_str}");
	svg_data.gsub!(/blue/		, "#{color_str}");
	File.open("#{tmp_fname}", "w") { |fOut| fOut << svg_data }
	
	system("rsvg #{tmp_fname} #{png_fname}");

	# NOTE: here tmp_fname SHOULD be deleted, but i dont like to delete inside script
end

# get the size from the cmdline parameter
size_str	= ARGV[0];

# generate the PNG for each possible state of webpack-badge
generate_png("inprobing", size_str);
generate_png("toinstall", size_str);
generate_png("toupgrade", size_str);
generate_png("installed", size_str);