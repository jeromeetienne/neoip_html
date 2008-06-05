#!/usr/bin/ruby
#
# \par Brief Description
# Class to control neoip-casti recording
# - usage example: ./neoip-casti-recording.rb --cast_name superstream.flv --cast_privtext bonjour 
#          --httpi_mod flv 
#          --httpi_uri http://jmehost2:8080/stream.flv
#          --mdata_srv_uri http://jmehost1/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.rb

# the 'require' for the library i use
require 'optparse'
require '../base/ruby/neoip_casti_record_t.rb'


################################################################################
################################################################################
# 			parse the command line option
################################################################################
################################################################################
def parse_cmdline(args)
	cmdline_arg	= {};
	# define the default values
	cmdline_arg['apps_detect_uri']	= "http://localhost:4570";
	cmdline_arg['httpi_mod']	= "raw";
	cmdline_arg['loop_delay']	= 1;
  
	# initialize the option parser
	opts  = OptionParser.new do |opts|
		opts.banner = "Usage: #{File.basename($0)} [options] playlist_id track_pool_name"
		opts.separator ""
		opts.separator "Specific options:"  

		# 'cast_name' option
		opts.on("-c", "--cast_name name", "specify the cast_name") do |val|
			cmdline_arg['cast_name']	= val;
		end

		# 'cast_privtext' option
		opts.on("-p", "--cast_privtext value", "specify the cast_privtext") do |val|
			cmdline_arg['cast_privtext']	= val;
		end
		
		# 'mdata_srv_uri' option
		opts.on("", "--mdata_srv_uri uri", "specify the mdata_srv_uri") do |val|
			cmdline_arg['mdata_srv_uri']	= val;
		end

		# 'httpi_uri' option
		opts.on("", "--httpi_uri uri", "specify the httpi_uri") do |val|
			cmdline_arg['httpi_uri']	= val;
		end

		# 'httpi_mod' option
		opts.on("", "--httpi_mod string", "specify the httpi_mod [raw|flv]") do |val|
			cmdline_arg['httpi_mod']	= val;
		end
		
		# 'http_peersrc_uri' option
		opts.on("", "--http_peersrc_uri uri", "specify the http_peersrc_uri") do |val|
			cmdline_arg['http_peersrc_uri']	= val;
		end

		# 'loop_delay' option
		opts.on("-d", "--loop_delay nb_second",
			"specify how long to wait between 2 iterations of the loop") do |val|
			cmdline_arg['loop_delay']	= val;
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

	# return the result
	return cmdline_arg;
end


################################################################################
################################################################################
#			Program itself
################################################################################
################################################################################

# parse the command line
cmdline_opt	= parse_cmdline(ARGV)


# TODO check this one is specified cmdline_opt['cast_name']

if not cmdline_opt['cast_name']
	$stderr.puts "Cast_name MUST be specified"
	exit -1
end
if not cmdline_opt['cast_privtext']
	$stderr.puts "cast_privtext MUST be specified"
	exit -1
end
if not cmdline_opt['httpi_uri']
	$stderr.puts "httpi_uri MUST be specified"
	exit -1
end


# init Neoip::Casti_record_t
casti_record	= Neoip::Casti_record_t.new( cmdline_opt['apps_detect_uri'],
				cmdline_opt['cast_name'], cmdline_opt['cast_privtext'], 
				cmdline_opt['mdata_srv_uri'],
				cmdline_opt['httpi_uri'], cmdline_opt['httpi_mod'],
				cmdline_opt['http_peersrc_uri']);


# trick to detect user pressing ctrl-c (aka sigint)
sigint_recved	= false;
Signal.trap("INT"){ sigint_recved = true }

# loop on the request_stream
old_state	= "none"
while not sigint_recved
	# request the stream
	cur_state	= casti_record.request_stream();
	#puts "update the request_stream"

	# display any change in the cur_state
	if( cur_state != old_state )
		puts "State changed from #{old_state} to #{cur_state} at #{Time.now} (cast_privhash=#{casti_record.cast_privhash})"
		if( cur_state == "started" )
			puts "url for player on this specific stream http://player.web4web.tv/#{casti_record.cast_privhash}/live/#{casti_record.cast_name}"
		end
	end

	# update the old_state
	old_state	= cur_state;

	# wait 'loop_delay' before going on with the next update
	# - a bit kludgy in order to stop sleeping when sigint_recved == true
	for i in (0..cmdline_opt['loop_delay']*2)
		# sleep for 0.5-sec
		sleep 0.5
		# leave the loop if sigint_recved
		break if sigint_recved
	end
end

puts "releasing the stream now..."
# to release the stream at the end
casti_record.release_stream();

