#! /usr/bin/env python

# import needed modules
from rstream_websrv_t import rstream_websrv_t
import simplejson
import sys, urllib2

# get the data from the input
data_str    = sys.stdin.read()
data_json   = simplejson.loads(data_str)

# create the web service API
websrv      = rstream_websrv_t()

# determine the op_fct
op_str      = sys.argv[1]
op_fct      = getattr(websrv, op_str)

# create all the rstream from the input file
rstream_arr = data_json
for rstream in rstream_arr :
    sys.stderr.write(op_str + " the remote server with cast_name " + rstream['cast_name'] + "\n")
    try:
        op_fct(rstream)
    except urllib2.HTTPError, error:
        print error




