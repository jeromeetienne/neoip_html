#! /usr/bin/env python
# script to build a minimal src directory which will be used to build air package

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
    path    = src_url[5:]
    return path

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
    path    = src_url[5:]
    return path
    
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

# TODO how come this one is about file while javascript/stylesheet are about data
def compress_html_file(path_src, path_dst, javascript_path, stylesheet_path):
    """process a html file"""
    javascript_injected = False
    stylesheet_injected = False
    # make the destination directory if needed
    mkdir_ifneeded(path_dst)
    fOut    = open(path_dst, "w+")
    # read the file line by line
    for line in open(path_src):
        # if this line is a javascript declaration, handle it differently
        if is_javascript_declaration(line) == True:
            # if the javascript replacement is not yet injected, do it now
            if javascript_injected == False:
                line    = "<script type='text/javascript' src='app:/"+javascript_path+"'/>"
                fOut.write(line+'\n')
                javascript_injected = True
            continue
        # if this line is a stylesheet declaration, handle it differently
        if is_stylesheet_declaration(line) == True:
            # if the stylesheet replacement is not yet injected, do it now
            if stylesheet_injected == False:
                line    = "<link rel='stylesheet' type='text/css' href='app:/"+stylesheet_path+"'/>"
                fOut.write(line+'\n')
                stylesheet_injected = True
            continue
        # write this line
        fOut.write(line)


def compress_javascript_data(data):
    """Compress the javascript data"""
    tmp_fname   = tempfile.mktemp("urfastr-player-air-min.js")
    open(tmp_fname, "w+").write(data)
    cmdline = ["yui-compressor", tmp_fname]
    compressed_data   = subprocess.Popen(cmdline, stdout=subprocess.PIPE).communicate()[0]
    os.remove(tmp_fname)    
    return compressed_data
    
def compress_stylesheet_data(data):
    """Compress the stylesheet data"""
    tmp_fname   = tempfile.mktemp("urfastr-player-air-min.css")
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
        data += open('src/'+path).read()
    return data

def process_html_file(html_path, src_rootpath, dst_rootpath):
    """Process the html file (aka minify html+js+css)"""
    print("Processing "+html_path+"...");
    javascript_min_path = 'js/' + os.path.basename(html_path).split('.')[0] + '-min.js'
    stylesheet_min_path = 'css/' + os.path.basename(html_path).split('.')[0] + '-min.css'
    # handle the javascript in the html file
    javascript_paths    = javascript_paths_for(src_rootpath+"/"+html_path)
    javascript_data     = concat_data_from_paths(javascript_paths)
    javascript_packed   = compress_javascript_data(javascript_data)
    myfilewrite(javascript_packed, dst_rootpath + '/' + javascript_min_path)
    # handle the stylesheet in the html file
    stylesheet_paths    = stylesheet_paths_for(src_rootpath+"/"+html_path)
    stylesheet_data     = concat_data_from_paths(stylesheet_paths)
    stylesheet_packed   = compress_stylesheet_data(stylesheet_data)
    myfilewrite(stylesheet_packed, dst_rootpath + '/' + stylesheet_min_path)
    # compress the html file itself
    compress_html_file(src_rootpath+'/'+html_path, dst_rootpath+'/'+html_path,
                        javascript_min_path, stylesheet_min_path)

#####################################################
#####################################################
#                                                   #
#####################################################
#####################################################

if len(os.sys.argv) != 3:
    print("usage: %s path_src_dir path_dst_dir" % os.sys.argv[0])
    os.sys.exit(-1);

src_rootpath    = os.sys.argv[1]
dst_rootpath    = os.sys.argv[2]

html_paths      = [ "html/index.html",
                    "html/pipwin.html",
                    "html/prefwin.html",
                  ]
img_paths   = ["images/resize-ne.png",
        "images/resize-nw.png",
        "images/resize-se.png",
        "images/resize-sw.png",
        "images/resize-sw.png",
        "images/titleBar-16.png",
        "images/thumbnail-16.png",
        "images/thumbnail-32.png",
        "images/thumbnail-48.png",
        "images/thumbnail-128.png",
        ["js/jquery/plugins/cluetip/images/arrowleft.gif"   , "css/images/arrowleft.gif"    ],
        ["js/jquery/plugins/cluetip/images/arrowright.gif"  , "css/images/arrowright.gif"   ],
        ["js/jquery/plugins/cluetip/images/arrowup.gif"     , "css/images/arrowup.gif"      ],
        ["js/jquery/plugins/cluetip/images/arrowdown.gif"   , "css/images/arrowdown.gif"    ]
        ]
lib_paths   = ["lib/applicationupdater_ui.swf",
        ]

# process all the html_paths
for html_path in html_paths:
    process_html_file(html_path, src_rootpath, dst_rootpath)
# process all the img_paths+lib_paths
for path in img_paths + lib_paths:
    if( type(path) == str ):
        path_src    = src_rootpath + '/' + path
        path_dst    = dst_rootpath + '/' + path
        mycopyfile(path_src, path_dst)
    else:
        path_src    = src_rootpath + '/' + path[0]
        path_dst    = dst_rootpath + '/' + path[1]
        mycopyfile(path_src, path_dst)

