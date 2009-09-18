#! /usr/bin/env python

import re, os, shutil, subprocess, tempfile
import pprint
import re

def compress_javascript_data(data):
    """Compress the javascript data"""
    tmp_fname   = tempfile.mktemp("urfastr-player-air-min.js")
    open(tmp_fname, "w+").write(data)
    cmdline = ["yui-compressor", tmp_fname]
    compressed_data   = subprocess.Popen(cmdline, stdout=subprocess.PIPE).communicate()[0]
    os.remove(tmp_fname)    
    return compressed_data

def remove_html_comment(html_data):
    """return the html without all the comments"""
    html_data   = re.compile('<!--(.*?)-->', re.MULTILINE|re.DOTALL).sub("", html_data)
    return html_data
    
def remove_javascript_tags(html_data):
    """return the html without all the javascript tags"""
    html_data   = re.compile('<script.*?</script>', re.MULTILINE|re.DOTALL).sub("", html_data)
    return html_data

def wrap_javascript_in_anonfct(js_data):
    """wrap js in a anonymous function. just to experiment its effects on the compression rate"""
    return "(function(){"+js_data+"})()"

def extract_javascript_from_html(html_data):
    """extract all the js elements from the html data"""
    # grab all the js elements
    js_elems    = re.compile('<script(.*?)</script>', re.MULTILINE|re.DOTALL).findall(html_data)
    # go thru all the js_elements
    js_data     = ""
    for js_elem in js_elems:
        # if the first char is ">", it is a imediate js
        if js_elem[0] == '>':
            #pprint.pprint(js_elem[1:])
            js_data += js_elem[1:]
        # if the first char is " ", it is a js file
        if js_elem[0] == ' ':
            pprint.pprint(js_elem[6:-2])
            js_fname    = js_elem[6:-2]
            js_data += open(js_fname).read()
    # return the rest
    return js_data    

def append_javascript_on_bottom_page(html_data, js_data):
    """append the js just before the end of the html body"""
    print "blbl11"
    #html_data   = re.compile(r'</body>').sub(tmp, html_data)
    tmp         = re.split("</body>", html_data)
    print "tmp=%s" % tmp
    html_data   = tmp[0] + "<script>" + js_data + "</script></body>" + tmp[1]
    print "blbl22"
    return html_data

def process_html_file(src_fname, dst_fname):
    """process the html file"""
    html_path   = src_fname
    # read the html file
    html_data   = open(html_path).read()    
    # remove all the comments
    html_data   = remove_html_comment(html_data)
    # extract all the js data
    js_data     = extract_javascript_from_html(html_data)
    # remove all the js
    html_data   = remove_javascript_tags(html_data)
    
    print("lenght uncompressed=%d" % len(js_data))
    #js_data = wrap_javascript_in_anonfct(js_data)
    js_data = compress_javascript_data(js_data)
    print("lenght compressed=%d" % len(js_data))
    js_data = compress_javascript_data(js_data)
    print("lenght compressed=%d" % len(js_data))
    
    # append js at the bottom of the page
    html_data   = append_javascript_on_bottom_page(html_data, js_data)
    
    # write the result in the dst_file
    open(dst_fname, "w").write(html_data)

process_html_file("neoip_ezplayer_widget.html", "slota.html")
