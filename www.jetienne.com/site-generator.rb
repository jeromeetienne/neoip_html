#!/usr/bin/ruby
#
# \par Short Description 
# generate a html site

# list of require
require 'rubygems'
require 'fileutils'
require 'xmlsimple'

################################################################################
################################################################################
#			Page generation
################################################################################
################################################################################

def generate_page(template_fname, src_body_fname, dst_body_fname)
	# get the data fname from the cmdline ARGV
	src_body_dname	= File.dirname(src_body_fname);
	# read data from the data fileS
	data_xml	= XmlSimple.xml_in(src_body_fname)
	html_title	= data_xml['html_title']
	html_body	= data_xml['html_body']
	html_side	= File.read("#{src_body_dname}/" + data_xml['side_html'][0]['filename']);
	
	# read the template
	page_data	= File.read(template_fname);
	# replace the pattern of the template by the proper data 
	page_data.gsub!(/@HTML_TITLE@/		, "#{html_title}");
	page_data.gsub!(/@HTML_BODY@/		, "#{html_body}");
	page_data.gsub!(/@HTML_SIDE@/		, "#{html_side}");

	# write the destination file
	File.open(dst_body_fname, 'w+'){|f| f.write(page_data)}
end

################################################################################
################################################################################
#			Main code
################################################################################
################################################################################

# copy the base/ on the dst/ directory
FileUtils.mkdir_p("dst/")
system("cp -r base/* dst");

# go thru all the *.data.html in the src/ directory
data_fname_arr	= Dir.glob("src/**/*");
data_fname_arr.each { |src_fname|
	# create the destination sub-directory
	dst_fname	= src_fname.gsub("src/","dst/")
	dst_dname	= File.dirname(dst_fname);
	FileUtils.mkdir_p(dst_dname)

	# process this file depending on its type
	if src_fname =~ /.side.html/
		# do nothing - as it is part of a template page
	elsif File.directory?(src_fname)
		# do nothing
	elsif src_fname =~ /.body.html/
		# generate the page from the template
		dst_body_fname	= dst_fname.gsub(".body.html",".html")
		generate_page("page_style.template.html", src_fname, dst_body_fname);
	else
		# just copy the file - as it is a static file
		FileUtils.cp(src_fname, dst_dname);
	end
} 
