build: components
	@component build

components:
	@component install

templates:
	#@component convert template.html

clean:
	rm -fr build components template.js

.PHONY: clean