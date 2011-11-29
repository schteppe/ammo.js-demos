all:
	if [ ! -d "temp" ]; then mkdir temp; fi;
	./js2doxy.pl ../src/DemoApplication.js > temp/DemoApplication.js
	doxygen Doxyfile
