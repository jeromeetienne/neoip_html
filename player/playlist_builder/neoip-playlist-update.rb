#!/usr/bin/ruby
#
# \par Brief Description
# This is a small utility to update playlist. this allow to specify the playlist_id

require 'optparse'
require 'rubygems'
require 'json'
require 'fileutils'
require 'neoip_plistgen_info_t'
require 'neoip_playlist_updater_t'

################################################################################
################################################################################
# 			parse the command line option
################################################################################
################################################################################
def parse_cmdline(args)
	cmdline_arg	= {};
	# define the default values
	cmdline_arg['noloop']		= false;
	cmdline_arg['loop_delay']	= 30;
	cmdline_arg['config_dir']	= "config_dir";
	cmdline_arg['output_dir']	= "../cache";
  
	# initialize the option parser
	opts  = OptionParser.new do |opts|
		opts.banner = "Usage: neoip-playlist-upd.rb [options] playlist_id track_pool_name"
		opts.separator ""
		opts.separator "Specific options:"  

		# 'noloop' option
		opts.on('-n', "--noloop",
				"explicitly ask NOT to loop") do |val|
			cmdline_arg['noloop']	= true
		end
		# 'loop_delay' option
		opts.on("-d", "--loop_delay nb_second",
			"specify how long to wait between 2 iterations of the loop") do |val|
			cmdline_arg['loop_delay']	= val;
		end
		# 'config_dir' option
		opts.on("-c", "--config_dir dirpath",
			"specify the configuration directory") do |val|
			cmdline_arg['config_dir']	= val;
		end
		# 'output_dir' option
		opts.on("-o", "--output_dir dirpath",
			"specify the output directory") do |val|
			cmdline_arg['output_dir']	= val;
		end

		opts.separator ""
		opts.separator "Common options:"
		# No argument, shows at tail.  This will print an options summary.
		# Try it and see!
		opts.on_tail("-h", "--help", "Show this message") do
			puts opts
			exit
		end
	end
	# parse the args
	opts.parse!(args)
	
	# NOTE: from the remaining arguments, extract them from the remaining args
	# - example: cmdline_arg['track_pool_name']	= args[0]


	# if 'config_dir' is not defined, display an error
	if not cmdline_arg['config_dir'] 
		$stderr.puts("#{$0}: --config_dir MUST be defined")
		return nil;
	end
	# if 'output_dir' is not defined, display an error
	if not cmdline_arg['output_dir'] 
		$stderr.puts("#{$0}: --output_dir MUST be defined")
		return nil;
	end


	# return the result
	return cmdline_arg;
end

################################################################################
################################################################################
# 			update the static playlist.jspf
################################################################################
################################################################################
def playlist_update_static(config_dir, output_dir)
	fname_arr	= Dir.glob("#{config_dir}/static_playlist.jspf/*.playlist.jspf")

	# copy all static_playlist_jspf into #{output_dir}/playlist.jspf
	fname_arr.each { |fname_src|
		bname_dst	= File.basename(fname_src);
		fname_dst	= "#{output_dir}/playlist.jspf/#{bname_dst}";
		
		# copy fname_src to fname_dst
		FileUtils.cp(fname_src, fname_dst );
	}
end


################################################################################
################################################################################
# 			update the dyname playlist.jspf
################################################################################
################################################################################
def playlist_update_dynamic(config_dir, output_dir)
	# get the fname_arr from the dirpatch
	fname_arr	= Dir.glob("#{config_dir}/plistgen_info/*.plistgen_info")
	
	# update all jspf playlist for each found plistgen_info
	fname_arr.each { |fname_src|
		bname_dst	= File.basename(fname_src).gsub(/\.plistgen_info$/,'.playlist.jspf');
		fname_dst	= "#{output_dir}/playlist.jspf/#{bname_dst}";

		# read the plistgen_info
		plistgen_info	= Neoip::Plistgen_info_t.from_file(fname_src)
		
		puts "playlist with playlist_id=#{plistgen_info.playlist_id()}"
		puts "fname_dst=#{fname_dst}"

		begin
			# launch a Playlist_updater_t on this playlist_id
			playlist_updater= Neoip::Playlist_updater_t.new(plistgen_info, fname_dst)
			playlist_updater.update();
		rescue => e
			# log the event
			$stderr.puts "unable to update playlist from #{fname_src} to #{e}";
			$stderr.puts e.backtrace;
		end
	}
end


################################################################################
################################################################################
#			Program itself
################################################################################
################################################################################

# parse the command line
cmdline_opt	= parse_cmdline(ARGV)
if cmdline_opt == nil
	exit
end

# update the static playlist.jspf
playlist_update_static(cmdline_opt['config_dir'], cmdline_opt['output_dir']);

# set Neoip::Flv_uri_t::cache_rootdir as the output_dir
Neoip::Flv_uri_t::cache_rootdir	= cmdline_opt['output_dir'];

# loop on the Playlist_updater_t
while true
	# update the dynamic playlist.jspf
	playlist_update_dynamic(cmdline_opt['config_dir'], cmdline_opt['output_dir']);
	
	# if no loop must be made, return now
	if cmdline_opt['noloop'] == true
		break;
	end

	# wait 'loop_delay' before going on with the next update
	puts "======= start to sleep for #{cmdline_opt['loop_delay']}-sec =========="
	sleep	cmdline_opt['loop_delay']
end


