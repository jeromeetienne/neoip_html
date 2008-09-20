# very raw Makefile to compile the webrunner webapp

WEBAPP_TITLE=urfastr-player.webapp
WEBAPP_FILES=webapp_icon.png webapp.css webapp.ini

$(WEBAPP_TITLE): $(WEBAPP_FILES)
	zip $@ $^
	
clean:
	rm -f $(WEBAPP_TITLE)