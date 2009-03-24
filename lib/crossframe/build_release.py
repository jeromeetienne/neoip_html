#! /usr/bin/env python
# script to build a minimal html of the proxy
# - it simply take crossframe_proxy.js, minify it, and put it in a html page

import re, os, shutil, subprocess, tempfile
from pprint import pprint

def compress_javascript_data(js_data):
    """Compress the javascript data"""
    tmp_fname   = tempfile.mktemp("compress_javascript_data.js")
    open(tmp_fname, "w+").write(js_data)
    cmdline = ["yui-compressor", tmp_fname]
    js_pack = subprocess.Popen(cmdline, stdout=subprocess.PIPE).communicate()[0]
    os.remove(tmp_fname)
    return js_pack

def remove_firebug_call(js_data):
    """Remove firebug from the javascript data"""
    myregexp    = re.compile('console\.[^(]*?\([^()]*?\);')
    js_nofb     = myregexp.sub(';', js_data)
    return js_nofb

def concat_data_from_paths(paths):
    """concatenate data from all the paths"""
    data     = ''
    for path in paths:
        data += open(path).read()
    return data

def generate_proxy_html():
    """generate crossframe_proxy.html from crossframe_proxy.js"""
    # read the original js, remove firebug call and minify it
    js_data     = open('crossframe_proxy.js').read();
    js_nofb     = remove_firebug_call(js_data)
    js_pack	    = compress_javascript_data(js_nofb)
    # generate the page
    html_full	=  """<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html><body><script>"""
    html_full	+= js_pack
    html_full	+= """</script></body></html>"""
    # write the result
    open('crossframe_proxy.html', "w+").write(html_full);

def generate_rpc_standalone():
    # generate the client
    js_data     = concat_data_from_paths(['json2.js', 'crossframe.js', 'crossframe_rpc_client.js'])
    js_nofb     = remove_firebug_call(js_data)
    js_pack	    = compress_javascript_data(js_nofb)
    open('crossframe_rpc_client.standalone-min.js', "w+").write(js_pack);
    # generate the server
    js_data     = concat_data_from_paths(['json2.js', 'crossframe.js', 'crossframe_rpc_server.js'])
    js_nofb     = remove_firebug_call(js_data)
    js_pack	    = compress_javascript_data(js_nofb)
    open('crossframe_rpc_server.standalone-min.js', "w+").write(js_pack);

generate_proxy_html()
generate_rpc_standalone()