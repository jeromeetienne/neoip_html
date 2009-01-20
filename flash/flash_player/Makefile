# very raw makefile
#

MXMLC=mxmlc
MXMLC_OPTS	=	-compiler.optimize -compiler.strict -compiler.as3
MXMLC_OPTS_DBG	=	-define=CONFIG::debug,true -define=CONFIG::release,false
MXMLC_OPTS_REL	=	-define=CONFIG::debug,false -define=CONFIG::release,true

MAIN_SRC=flash_player.as

MAIN_OUT_DBG	= bin/flash_player-dbg.swf
MAIN_OUT_REL	= bin/flash_player-rel.swf


all: player-rel

player-dbg:
	$(MXMLC) $(MXMLC_OPTS) $(MXMLC_OPTS_DBG) $(MAIN_SRC) -output $(MAIN_OUT_DBG)

player-rel:
	$(MXMLC) $(MXMLC_OPTS) $(MXMLC_OPTS_REL) $(MAIN_SRC) -output $(MAIN_OUT_REL)

clean:
	rm -f $(MAIN_OUT_REL) $(MAIN_OUT_DBG)

