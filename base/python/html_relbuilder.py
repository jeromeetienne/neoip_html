# This module contains a bunch of functions which help packaging html files
# - this is used to package the adobe_air application and the player itself
# - convert all those functions to be as independant as possible

import re, os, shutil, subprocess, tempfile
from pprint import pprint

def is_javascript_declaration(line):
    """Return True if this line is a javascript declaration, False otherwise"""
    if re.match(r'.*<script .*', line) == None:
        return False
    # if this line is not a text/javascript, goto the next
    if re.match(r'.*type=\"text/javascript\".*', line) == None:
        return False
    return True

def path_from_javascript_declaration(line):
    """Extract the path of this line assuming this is a javascript declaration"""
    src_url = re.match(r'.*src=\"(.*)\"', line).group(1)
    return src_url

def is_stylesheet_declaration(line):
    """Return True if this line is a stylesheet declaration, False otherwise"""
    if re.match(r'.*<link .*', line) == None:
        return False
    # if this line is not a text/javascript, goto the next
    if re.match(r'.*rel=\"stylesheet\".*', line) == None:
        return False
    return True

def path_from_stylesheet_declaration(line):
    """Extract the path of this line assuming this is a stylesheet declaration"""
    src_url = re.match(r'.*href=\"(.*)\"', line).group(1)
    return src_url
    
def javascript_paths_for(html_fname):
    """Return an array of src url for all js script tags"""
    src_paths   = []
    # read the file line by line
    for line in open(html_fname):
        if is_javascript_declaration(line) == False:
            continue
        # extract the source url
        path    = path_from_javascript_declaration(line)
        src_paths.append(path)
    # return the just built array
    return src_paths

def stylesheet_paths_for(html_fname):
    """Return an array of src url for all stylesheet link tags"""
    src_paths    = []
    # read the file line by line
    for line in open(html_fname):
        if is_stylesheet_declaration(line) == False:
            continue
        # extract the source url
        path    = path_from_stylesheet_declaration(line)
        src_paths.append(path)
    # return the just built array
    return src_paths

def compress_javascript_data(data):
    """Compress the javascript data"""
    tmp_fname   = tempfile.mktemp("compress_javascript_data.js")
    open(tmp_fname, "w+").write(data)
    cmdline = ["yui-compressor", tmp_fname]
    compressed_data   = subprocess.Popen(cmdline, stdout=subprocess.PIPE).communicate()[0]
    os.remove(tmp_fname)    
    return compressed_data
    
def compress_stylesheet_data(data):
    """Compress the stylesheet data"""
    tmp_fname   = tempfile.mktemp("compress_stylesheet_data.css")
    open(tmp_fname, "w+").write(data)
    cmdline = ["yui-compressor", tmp_fname]
    compressed_data   = subprocess.Popen(cmdline, stdout=subprocess.PIPE).communicate()[0]
    os.remove(tmp_fname)    
    return compressed_data


def mkdir_ifneeded(path_dst):
    """do a mkdir of the destination dirname if needed"""
    dirname_dst = os.path.dirname(path_dst)
    if os.path.exists(dirname_dst) == False:
        os.makedirs(dirname_dst)

def mycopyfile(path_src, path_dst):
    """copy file and make destination directories if needed"""
    # make the destination directory if needed
    mkdir_ifneeded(path_dst)
    # copy the content
    shutil.copy(path_src, path_dst)

def myfilewrite(file_data, path_dst):
    """write file_data in the path_dst, and make destination directory if needed"""
    mkdir_ifneeded(path_dst)
    open(path_dst, "w+").write(file_data)

def concat_data_from_paths(paths):
    """concatenate data from all the paths"""
    data     = ''
    for path in paths:
        data += open(path).read()
    return data

def javascript_warp_in_anonfct(javascript_data):
    """warp javascript data in a anonymous function. supposedly: better compression and less namespace pollution"""
    return "(function(){"+javascript_data+"})()";

def javascript_remove_firebug(javascript_data):
    fb_match    = re.compile('console\..*?(.*?)', re.DOTALL)
    #fb_match    = re.compile('console\..*?(.*?)')
    result      = fb_match.sub('', javascript_data)
    return result
