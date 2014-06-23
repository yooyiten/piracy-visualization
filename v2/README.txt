/index.html (our visualization)

/data
    -fora.json (the data used for the visualization, fed in with d3.json)

/js
    -main.js (our main js file for the visualization)
    -d3.v3.js (d3, on which our visualization runs)
    -jquery-jui.min.js, jquery.min.js (used for the slider and buttons)
    -colorbrewer.js (used for our color encoding)
 
/css
    -main.css (our css file with the styling for our webpage)
    -jquery-ui.min.css (used for the slider and buttons)
    -/images (this is an image folder, but it is used by jquery-ui.min.css)


* To run the website locally, first start an HTTP server within the directory of index.html by typing 'python -m SimpleHTTPServer' in a terminal. You can then access the page with http://localhost:8000/.

All of our .js library files are hosted in the folder because we were testing on Google Drive.

