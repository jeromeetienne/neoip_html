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

print 'reading js files...'
orig_data   = open('urfastr_live.js').read()
xfrm_data   = open('../../lib/crossframe/crossframe_rpc_clientserver.standalone-min.js').read()

filename    = "urfastr_player_jsapi-min.js"
print 'producing %s ...' % filename
pack_data   = compress_javascript_data(orig_data)
open(filename, "w").write(pack_data)

filename    = "urfastr_player_jsapi-xfrm-min.js"
print 'producing %s ...' % filename
pack_data   = compress_javascript_data(xfrm_data+orig_data)
open(filename, "w").write(pack_data)
