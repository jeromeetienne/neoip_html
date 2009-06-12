# very raw Makefile to preprocess the php


SRC_JS=urfastr_livatar_core-php.js
DEV_JS=urfastr_livatar_core-dev.js
REL_JS=urfastr_livatar_core-rel.js
DEV_MIN_JS=urfastr_livatar_core-dev-min.js
REL_MIN_JS=urfastr_livatar_core-rel-min.js

JS_COMPRESSOR=yui-compressor

all: build_all

$(DEV_JS): $(SRC_JS)
	php -f $(SRC_JS) -- --dev > $(DEV_JS);

$(DEV_MIN_JS): $(DEV_JS)
	$(JS_COMPRESSOR) $(REL_JS) > $(DEV_MIN_JS)

$(REL_JS): $(SRC_JS)
	php -f $(SRC_JS) -- --rel > $(REL_JS);

$(REL_MIN_JS): $(REL_JS)
	$(JS_COMPRESSOR) $(REL_JS) > $(REL_MIN_JS)

build_dev: $(DEV_JS)

build_rel: $(REL_MIN_JS)


build_all: build_dev build_rel

watch:	build_all
	@echo "Start Watching (every second)"
	while true; do sleep 1; [ -z "`find . -name $(SRC_JS)  -newer $(DEV_JS)`" ] && continue; echo "Recompilation at `date`"; make; done

clean:
	rm -f $(DEV_JS) $(REL_JS)
	rm -f $(DEV_MIN_JS) $(REL_MIN_JS)
