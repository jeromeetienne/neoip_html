#! /usr/bin/env python

import re, os, shutil, subprocess, tempfile
import pprint
import re


def compress_javascript_data(data):
    """Compress the javascript data"""
    tmp_fname   = tempfile.mktemp("build_release-min.js")
    open(tmp_fname, "w+").write(data)
    cmdline = ["yui-compressor", tmp_fname]
    compressed_data   = subprocess.Popen(cmdline, stdout=subprocess.PIPE).communicate()[0]
    os.remove(tmp_fname)    
    return compressed_data

def remove_firebug_calls(js_data):
    """remove all firebug calls from js_data"""
    js_data = re.compile('console\.[^(]*?\([^()]*?\);').sub("", js_data)
    return js_data

print 'reading js files...'
orig_data   = open('urfastr_player_jsapi.js').read()
xfrm_data   = open('../../lib/crossframe/crossframe_rpc_clientserver.standalone-min.js').read()

filename    = "urfastr_player_jsapi-min.js"
print 'producing %s ...' % filename
pack_data   = remove_firebug_calls(orig_data)
pack_data   = compress_javascript_data(pack_data)
open(filename, "w").write(pack_data)

filename    = "urfastr_player_jsapi-xfrm-min.js"
print 'producing %s ...' % filename
pack_data   = remove_firebug_calls(xfrm_data+orig_data)
pack_data   = compress_javascript_data(pack_data)
open(filename, "w").write(pack_data)
