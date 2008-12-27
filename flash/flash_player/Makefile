# very raw makefile
#

MXMLC=mxmlc
MXMLC_OPTS=-compiler.optimize -compiler.strict -compiler.as3

MAIN_SRC=flash_player.as
MAIN_OUT=bin/flash_player.swf


all: player

player:
	$(MXMLC) $(MXMLC_OPTS) $(MAIN_SRC) -output $(MAIN_OUT)

upload:	
	scp bin/flash_player.swf dedixl:workspace_flash/flash_player/bin-release

