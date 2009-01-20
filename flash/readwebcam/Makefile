# very raw makefile
#

MXMLC=mxmlc
MXMLC_OPTS	=	-compiler.optimize -compiler.strict -compiler.as3
MXMLC_OPTS_DBG	=	-define=CONFIG::debug,true -define=CONFIG::release,false
MXMLC_OPTS_REL	=	-define=CONFIG::debug,false -define=CONFIG::release,true

MAIN_SRC=readwebcam.as

MAIN_OUT_DBG	= bin/readwebcam-dbg.swf
MAIN_OUT_REL	= bin/readwebcam-rel.swf


all: readwebcam-rel

readwebcam-dbg:
	$(MXMLC) $(MXMLC_OPTS) $(MXMLC_OPTS_DBG) $(MAIN_SRC) -output $(MAIN_OUT_DBG)

readwebcam-rel:
	$(MXMLC) $(MXMLC_OPTS) $(MXMLC_OPTS_REL) $(MAIN_SRC) -output $(MAIN_OUT_REL)

clean:
	rm -f $(MAIN_OUT_REL) $(MAIN_OUT_DBG)
