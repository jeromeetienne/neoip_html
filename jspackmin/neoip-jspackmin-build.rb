#!/usr/bin/env ruby
#
# \par TODO remove ALL the firebug stuff 
# - remove the firebug script from the list of script
# - remove all the invokation of console.info() and co in the code
# - how to remove all the console.*() stuff ? 
# - issue with the nested parentheses in the console.info() argument
#   - e.g. console.info("my date=" + date.getTime());

# list of all the 'require'
require 'tempfile'
require 'optparse'
require 'pp'


################################################################################
################################################################################
# 			parse the command line option
################################################################################
################################################################################
def parse_cmdline(args)
	cmdline_arg	= {};
	# define the default values
	cmdline_arg['keep_firebug']	= false;
	  
	# initialize the option parser
	opts  = OptionParser.new do |opts|
		opts.banner = "Usage: #{File.basename($0)} [options] playlist_id track_pool_name"
		opts.separator ""
		opts.separator "Specific options:"  

		# 'cast_name' option
		opts.on("-f", "--keep-firebug", "keep firebug and its calls. default to false") do |val|
			cmdline_arg['keep-firebug']	= true;
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

# check the cmdline 
if ARGV.length != 2
	$stderr.puts "wrong number of argument. first arg is the html page. second is the destination filename"
	exit
end
# get the arguments from the cmdline
input_fname	= ARGV[0];
output_fname	= ARGV[1];


basedir_path	= File.dirname(input_fname);
html_fname	= input_fname;
jsfname_arr	= []

# parse html_fname file to extract all the needed js file and put them into jsfname_arr
File.read(html_fname).split(/\n/).each do |line|
	line.chomp
	# if this line contain the duration, extract it
	if line =~ /<script.*src=/
		jsfname	= line.scan(/<script.*src=\"(.*)\"/)[0][0].to_s
		jsfname_arr	<< jsfname
	end
end

# replace any reference to firebug.js by firebug_noop.js - aka no-op for firebug function
if not cmdline_opt['keep-firebug']
	jsfname_arr.collect! { |jsfname| jsfname.match(/\/firebug\/firebug.js$/) ?
			jsfname.gsub(/\/firebug\/firebug.js$/, "/javascript/firebug_noop.js") :
			jsfname }
end


# read all the jsfname_arr files and put them into jsfdata_expand 
jsfdata_expand	= ""
jsfname_arr.each { |jsfname| jsfdata_expand += File.read("#{basedir_path}/#{jsfname}")	}

# remove all the firebug call from the code itself - produce shorter/faster code
# - TODO currently work IIF there are no nested parentheses in the console.info() function
# - TODO doesnt take care of the console.info() sent by asplayer
if not cmdline_opt['keep-firebug']
	jsfdata_expand.gsub!(/console\.[^(]*?\([^()]*?\);/, '')
end

# write the jsdata_str into jsfname_tmpfile
jsfname_tmpfile	= "/tmp/neoip_jsplayer_packmin_builder.tmp.js"
File.open(jsfname_tmpfile, "w+") { |file| file.write(jsfdata_expand)	}

# compress the jsfdata_tmpfile with yuicompressor
cmdline	= "java -jar yuicompressor-2.4.2.jar"
cmdline	+= " #{jsfname_tmpfile}"
cmdline	+= " 2>/dev/null"
jsfdata_packed	= `#{cmdline}` 

# NOTE: yuicompressor keep comments on the first pass... so
#       this is a second pass just to remove the comment
File.open(jsfname_tmpfile, "w+") { |file| file.write(jsfdata_packed)	}
jsfdata_packed	= `#{cmdline}` 


# unlink the jsfname_tmpfile
File.unlink(jsfname_tmpfile)


# TODO to remove - only there to help debug the flash init race condition in webkit
#jsfdata_packed	= jsfdata_expand;

# write the jsfdata_packed into a file
jsfname_packed	= output_fname
File.open(jsfname_packed, "w+") { |file| file.write(jsfdata_packed)	}

# display some statistic on the compression ratio
expand_ratio	= 1.0
packed_ratio	= 1.0 * jsfdata_packed.length/jsfdata_expand.length;
totlen_gziped	= `cat #{jsfname_packed} | gzip | wc -c`.to_f
gziped_ratio	= totlen_gziped/jsfdata_expand.length;
puts "total length expand=#{jsfdata_expand.length}-byte ratio=#{"%01.2f%%" % (100.0 * expand_ratio)}"
puts "total length packed=#{jsfdata_packed.length}-byte ratio=#{"%01.2f%%" % (100.0 * packed_ratio)}"
puts "total length packed+gzip=#{totlen_gziped}-byte ratio=#{"%01.2f%%" % (100.0 * gziped_ratio)}"

