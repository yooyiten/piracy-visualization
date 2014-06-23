window.onload = function() {

	// global json variables
	var forum;
	var nodes;
	var edges;

	// set up toggles
	var sizetoggle = true;
	var weighttoggle = false;
	var edgetoggle = true;
	var datetoggle = false;

	// set up dimensions
	var width = 920;
	var height = 600;

	// node color scale
	var ncolor = d3.scale.linear()
		.domain([0, 10, 50, 100])
		.range(colorbrewer.GnBu[3]);

	// node size scale
	var nsize = d3.scale.linear()
		.domain([0, 100])
		.range([3, 15]);

	// top ten commenters chart scale
	var commscale = d3.scale.linear()
		.domain([0, 350])
		.range([0, 200]);

    var parseDate = d3.time.format("%m/%d/%y %I:%M %p").parse;
    //var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S.%L").parse;
	//var parseDate = d3.time.format("%m/%d/%y").parse;
	// date formatter helper
	function formatdate(val) {
		if (!val) 
			return "";

		else {
			var days = val.getDate();
			var month = val.getMonth() + 1;
	    	var year = val.getFullYear();

			return month + "/" + days + "/" + year;
		}
	}

d3.json("data/forum.json", function(error, json) {
	if (error) return console.warn(error);
	
	forum = json;
	nodes = forum.nodes;
	edges = forum.edges;

	// initialize the visualization per theory.info demo
	function init(w, h, ndata, edata) {
		// set up the force layout
		var force = d3.layout.force()
	    	.size([w, h])
	    	.charge(-20)
	    	.linkDistance(20)
	    	.nodes(ndata)
	    	.links(edata)
	    	.start();

	    // this is based on a mbostock technique and will record whether nodes are neighbors
	    var linkindex = {};

	    edata.forEach(function(d) {
	    	linkindex[d.source.index + "," + d.target.index] = 1;
	    	linkindex[d.target.index + "," + d.source.index] = 1; });

	    // set up the svg
	    var cont = d3.select("body").insert("div")
	    	.attr("class", "cont");

		var svg = cont.append("svg")
	    	.attr("width", w)
	    	.attr("height", h);

	    svg.append("rect")
	    	.attr("width", w)
	    	.attr("height", h)
	    	.attr("class", "back");	

		// prime the controls
		d3.selectAll("#ctrl_seed")
			.on("change", function() { filtercount(); filteredge(); filterdate(); });
		d3.selectAll("#ctrl_edge")
			.on("change", function() { filtercount(); filteredge(); filterdate(); });
		d3.selectAll("#ctrl_toggle")
			.on("change", function() { toggledisplay(); toggledate(); filtercount(); filteredge(); filterdate(); });	

	    return {force: force, svg : svg, ndata: ndata, edata: edata, linkindex: linkindex};
	}

	// set graph display based on user-selected options
	function toggledisplay() {
		var cknode = document.getElementById("tognode").checked;
		var ckweight = document.getElementById("togweight").checked;
		var ckedge = document.getElementById("togedge").checked;

		if (cknode)
			sizetoggle = true; 
		else
			sizetoggle = false;

		if (ckweight)
			weighttoggle = true;
		else
			weighttoggle = false;

		if (ckedge)
			edgetoggle = true;
		else
			edgetoggle = false;
		
		if (edgetoggle) {
			d3.selectAll("line")
				.style("display", null);
		}
		else {
			d3.selectAll("line")
				.style("display", "none");
		}

		if (weighttoggle) {
			d3.selectAll("line")
				.style("stroke-width", function(d) { return Math.sqrt(d.edgeweight); });
		}
		else{
			d3.selectAll("line")
				.style("stroke-width", 1);		
		}

		if (sizetoggle) {
			d3.selectAll("circle")
				.attr("r", function(d) { return nsize(d.seedcount); });
		}
		else {
			d3.selectAll("circle")
				.attr("r", 3);
		}	      		
	}

	// set date slider based on seeders only option
	function toggledate() {
		var ckdate = document.getElementById("togdate").checked;

		d3.selectAll("#slidetxt")
			.html("");

		if (d3.selectAll(".ui-dateRangeSlider")[0].length > 0) {
			$("#time_slide").dateRangeSlider("destroy");
		}

		if (ckdate)
			datetoggle = true;
		else
			datetoggle = false;

		if (datetoggle) {
			$("#time_slide").dateRangeSlider(
				{bounds: {
					min: new Date(2006, 6, 5),
					max: new Date(2013, 3, 8)}},
				{arrows: false},
				{defaultValues: {
					min: new Date(2006, 6, 5),
					max: new Date(2013, 3, 8)}},
				{valueLabels: "show"},
				{formatter: function(val) { return formatdate(val); } });

			$("#time_slide").bind("userValuesChanged", 
						function() { filtercount(); filteredge(); filterdate(); });

			$("#time_slide").bind("valuesChanged", 
						function() { filtercount(); filteredge(); filterdate(); });
		}
	}

	// based on mbostock technique, checks if two nodes are connected
	function isNeighbor(a, b) {
		return (vis.linkindex[a + "," + b] || a == b);
	}

	function redraw(v) {
		drawgraph(v);
		drawchart();
		toggledisplay();
	}

	// draw the top ten chart
	function drawchart() {
		var commchart = d3.select("body").append("svg")
	    	.attr("class", "topten");

	    var cw = 200;
	    var ch = 200;
	    cdata = [315, 289, 126, 104, 68, 62, 42, 37, 32, 30];
	    cind = [1872, 215, 1360, 1172, 109, 1747, 226, 712, 117, 2032] ;

	    commchart.selectAll("rect")
	    	.data(cdata)
	        .enter()
	        .append("rect")
	        .attr("id", function(d, i) { return "rect" + cind[i]; } )
	       	.attr("x", function(d, i) { return i * (cw / cdata.length) + 3; })
	       	.attr("y", function(d) { return ch - commscale(d) ;})
	       	.attr("height", function(d) { return commscale(d); })
	       	.attr("fill", "#cccccc")
	       	.attr("width", 18)
	       	.on("mouseover", function(d, i) { highlightbar(i, cind[i]);
	       						displayprofile(vis.ndata[cind[i]], cind[i]); 
	       						displaynodetip(vis.ndata[cind[i]], cind[i]); })
	      	.on("mouseover.cursor", function() { document.body.style.cursor = 'pointer'; })
	       	.on("mouseout", function(d, i) { dimbar(i, cind[i]); hidenodetip(vis.ndata[cind[i]], cind[i]); })
	      	.on("mouseout.cursor", function() { document.body.style.cursor = 'default';});

	    commchart.selectAll("text")
	    	.data(cdata)
	        .enter()
	        .append("text")
	        .text(function(d) { return d; })
	        .attr("x", function(d, i) { return i * (cw / cdata.length); })
	        .attr("y", function(d) { return ch - commscale(d) ; });

	    commchart.append("text")
	    	.text("Top 10 Commenters")
	    	.attr("x", 60)
	    	.attr("y", 10);
	}

	// draws the graph
	function drawgraph(v) {	 
		var edge = v.svg.selectAll(".edge")
			.data(v.edata)
			.enter().append("line")
				.attr("class", function(d) { return "edge" + d.source.index + "to" + d.target.index; })
				.style("stroke-width", function(d) { return Math.sqrt(d.edgeweight); })
				.on("mouseover.tip", displayedgetip)
	      		.on("mouseover.cursor", function() { document.body.style.cursor = 'pointer'; })
				.on("mouseout.tip", hideedgetip)
	      		.on("mouseout.cursor", function() { document.body.style.cursor = 'default'; });

		var node = v.svg.selectAll(".node")
	    	.data(v.ndata)
	    	.enter().append("circle")
	      		.attr("class", function(d) { return "node" + d.seedcount; })
	      		.attr("r", function(d) { return nsize(d.seedcount); })
	      		.style("fill", function(d) { return ncolor(d.seedcount); })
	      		.on("mouseover.tip", displaynodetip)
	      		.on("mouseover.link", displaynodelink)
	      		.on("mouseover.profile", displayprofile)
	      		.on("mouseover.topten", highlightbar)
	      		.on("mouseover.cursor", function() { document.body.style.cursor = 'pointer'; })
	    		.on("mouseout.tip", hidenodetip)
	    		.on("mouseout.link", hidenodelink)
	    		.on("mouseout.topten", dimbar)
	      		.on("mouseout.cursor", function() { document.body.style.cursor = 'default'; })
	      		//.call(v.force.drag);

		v.force.on("tick", function() {
			edge.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
	    	node.attr("cx", function(d) { return d.x; })
	        	.attr("cy", function(d) { return d.y; }); });	
	}

	// highlights node and its neighbors
	function displaynodelink(d, i) {
		d3.selectAll("circle")
			.style("stroke", function (d, i2) { return isNeighbor(i, i2) ? "#E6550D" : "#000000"; })
			.style("stroke-width", function(d, i2) { return isNeighbor(i, i2) ? "3.5px" : "1.5px"; })
			.style("stroke-opacity", function(d, i2) { return isNeighbor(i, i2) ? .4 : .6; });
	}

	// removes node highlighting
	function hidenodelink() {
		d3.selectAll("circle")
			.style("stroke", "#000000")
    		.style("stroke-width", "1.5px")
    		.style("stroke-opacity", .6);
	}

	// displays user profile
	function displayprofile(d, i) {
		hideprofile();
  		
  		d3.select("body")	
    		.append("div")
    		.attr("class", "profile")
    		.html("user: <b>" + d.name + "</b><br />" +
          		  "total seed count: <b>" + d.seedcount + "</b><br />" +
          		  "total interactions: <b>" + d.totaledgeweight + "</b><br />" +
          		  "last seed date: <b>" + formatdate(parseDate(d.lastdate)) + "</b><br /><br />" +
          		  "interacted with: ");

      	d3.selectAll("circle")
      		.each(function(d2, i2) { 
      			  		if (isNeighbor(i2, i) && (i2 != i)) {
      						d3.selectAll(".profile").append("span")
      							.html("<br /><b>" + vis.ndata[i2].name + "</b>"); 
      					} });  		
	}

	// removes profile
	function hideprofile() {
		d3.selectAll(".profile")
    		.remove();
	}

	// displays node tooltip
	function displaynodetip(d, i) {
		var node = document.getElementsByTagName("circle")[i];

		if (node.style.display != "none") {
    		x = Math.round(d.x + 50);
  			y = Math.round(d.y + 360);	

  			d3.select("circles")
  				.filter(function(d2,i2) { return i == i2; })
  				.style("stroke", "#E6550D")
    			.style("stroke-width", "3.5px")
    			.style("stroke-opacity", 0.4); 

  			d3.select("body")
				.append("div")
    			.attr("class", "nodetip")
    			.attr("style", "top : " + y + "px; " + "left : " + x + "px;")
    			.html("<b>" + d.name + "</b>");			
		}
	}

	// removes node tooltip
	function hidenodetip(d, i) {
  		d3.select("circles")
  			.filter(function(d2,i2) { return i == i2; })
  			.style("stroke", "#000000")
    		.style("stroke-width", "1.5px")
    		.style("stroke-opacity", .6);

		d3.selectAll(".nodetip")
    		.remove();
	}

	// displays edge tooltip
	function displayedgetip(d, i) {
    	x = Math.round((d.source.x + d.target.x)/2) + 70;
  		y = Math.round((d.source.y + d.target.y)/2) + 355;	

  		d3.select("body")
			.append("div")
    		.attr("class", "edgetip")
    		.attr("style", "top : " + y + "px; " + "left : " + x + "px;")
    		.html("<b>" + d.source.name + "</b><br />" +
          		  "<b>" + d.target.name + "</b><br />" +
          		  "interactions: <b>" + d.edgeweight + "</b>");

  		d3.select(this)
    		.style("stroke", "#E6550D");
	}

	// removes edge tooltip
	function hideedgetip() {
		d3.selectAll(".edgetip")
			.remove();

		d3.select(this)
			.style("stroke", "#999");
	}

	// highlights selected top comment bar
	function highlightbar(d, i) {
		d3.select("#rect" + i)
			.style("stroke", "#E6550D")
			.style("stroke-width", "1.5px");

		d3.selectAll("circle")
			.filter(function(d2, i2) { return i == i2; })
			.style("stroke", "#E6550D")
			.style("stroke-width", "3.5px");
	}


	// removes top comment bar highlighting
	function dimbar(d, i) {
		d3.select("#rect" + i)
			.style("stroke", "none")
			.style("stroke-width", "none");

		d3.selectAll("circle")
			.filter(function(d2, i2) { return i == i2; })
			.style("stroke", "#000000")
			.style("stroke-width", "1.5px");
	}

	// filters nodes and edges based on node seed count
	function filtercount() {
		var countfilter = -1;
		var countradio = document.getElementById("ctrlseed").seedcount;

		for (i = 0; i < countradio.length; i++) {
			if (countradio[i].checked) {
				countfilter = parseInt(countradio[i].value);
				break;
			}
		}

		if (countfilter == 0) {
			d3.selectAll("circle")
				.style("display", function(d) { return (parseInt(d.seedcount) > countfilter) ? "none" : null; });	

			if (edgetoggle) {	
				d3.selectAll("line")
					.style("display", function(d) { 
						   return (parseInt(vis.ndata[d.source.index].seedcount) > countfilter ||
								   parseInt(vis.ndata[d.target.index].seedcount) > countfilter) ? 
								   "none" : null; });
			}
		}
		else if (countfilter >= 1) {
			d3.selectAll("circle")
				.style("display", function(d) { return (parseInt(d.seedcount) < countfilter) ? 
														"none" : null; });	
			if (edgetoggle) {
				d3.selectAll("line")
					.style("display", function(d) {
						   return (parseInt(vis.ndata[d.source.index].seedcount) < countfilter ||
								   parseInt(vis.ndata[d.target.index].seedcount) < countfilter) ? 
								   "none" : null; });
			}
		}
		else {
			d3.selectAll("circle")
				.style("display", null);
			if (edgetoggle) {
				d3.selectAll("line")
					.style("display", null);
			}
		}
	}

	// filter nodes and edges based on node total edge weight count
	function filteredge() {
		var edgefilter = -1;
		var edgeradio = document.getElementById("ctrledge").edgetotal;

		for (i = 0; i < edgeradio.length; i++) {
			if (edgeradio[i].checked) {
				edgefilter = parseInt(edgeradio[i].value);
				break;
			}
		}

		if (edgefilter == 0) {
			d3.selectAll("circle")
				.style("display", function(d) { return (parseInt(d.totaledgeweight) > edgefilter) ? "none" : null; });	

			if (edgetoggle) {	
				d3.selectAll("line")
					.style("display", function(d) { 
						   return (parseInt(vis.ndata[d.source.index].seedcount) > edgefilter ||
								   parseInt(vis.ndata[d.target.index].seedcount) > edgefilter) ? 
								   "none" : null; });
			}
		}
		else if (edgefilter >= 0) {
			d3.selectAll("circle")
				.filter(function(d) { return this.style.display != "none"; })
				.style("display", function(d) { return (parseInt(d.totaledgeweight) < edgefilter) ? 
												"none" : null; });
			if (edgetoggle) {	
				d3.selectAll("line")
					.filter(function(d) { return this.style.display != "none"; })
					.style("display", function(d) {
						   return (parseInt(vis.ndata[d.source.index].totaledgeweight) < edgefilter ||
								   parseInt(vis.ndata[d.target.index].totaledgeweight) < edgefilter) ? 
								   "none" : null; });
			}
		}
	}

	// filter nodes and edges based on node last seed date
	function filterdate() {
		if (datetoggle) {
			var min = $("#time_slide").dateRangeSlider("min");
			var max = $("#time_slide").dateRangeSlider("max");

			d3.selectAll("circle")
				.filter(function(d) { return this.style.display != "none"; })
				.style("display", function(d) { 
					   return (parseDate(d.lastdate) >= min &&
					    	   parseDate(d.lastdate) <= max) ? null : "none"; });
			if (edgetoggle) {
				d3.selectAll("line")
					.filter(function(d) { return this.style.display != "none"; })
					.style("display", function(d) {
						   return ((parseDate(vis.ndata[d.source.index].lastdate) >= min &&
						    	    parseDate(vis.ndata[d.source.index].lastdate) <= max) &&
						    	   (parseDate(vis.ndata[d.target.index].lastdate) >= min &&
						    	    parseDate(vis.ndata[d.target.index].lastdate) <= max)) ? null : "none"; });
			}	
			d3.selectAll("#slidetxt")
				.html("Last seeded between " + formatdate(min) + " and " + formatdate(max));
		}
	}

    // helper function to get range
    function getMax() {
        var seedmax = 0;
        var totaledgemax = 0;
        var edgemax = 0;

        for (var i = 0; i < nodes.length; i++) {
            sc = nodes[i].seedcount;
            tew = parseInt(nodes[i].totaledgeweight);
            ew = edges[i].edgeweight;
            if (sc > seedmax)
                seedmax = sc;        
            if (tew > totaledgemax) 
                totaledgemax = tew;
            if (ew > edgemax)
                edgemax = ew;
        }
            console.log("max total edgeweight:" + totaledgemax);
            console.log("max pair edgeweight:" + edgemax);
            console.log("max seedcount:" + seedmax);
    }

    // helper function to get top ten
    function getTopTen() {
    	var topseeders = new Array();
    	var topinter = new Array();

    	for (var i = 0; i < nodes.length; i++) {
    		s = nodes[i].seedcount;
    		e = nodes[i].totaledgeweight;
    		topseeders.push([i, s]);
    		topinter.push([i, e]);
    	}

        topseeders.sort(function(a, b) { return (parseInt(a[1]) < parseInt(b[1]) ? -1 : 
        									(parseInt(a[1]) > parseInt(b[1]) ? 1 : 0)) });

        topinter.sort(function(a, b) { return (parseInt(a[1]) < parseInt(b[1]) ? -1 : 
        									(parseInt(a[1]) > parseInt(b[1]) ? 1 : 0)) });

        var ttseed = new Array();
        var ttseedval = new Array();
        var ttinter = new Array();
        var ttinterval = new Array();
        for (var i = nodes.length - 1; i >= nodes.length - 10; i--) {
        	ttseed.push(topseeders[i][0]);
        	ttinter.push(topinter[i][0]);
        	ttseedval.push(parseInt(topseeders[i][1]));
        	ttinterval.push(parseInt(topinter[i][1]));
    	}
    	console.log(ttseed);
    	console.log(ttseedval);
    	console.log(ttinter);
    	console.log(ttinterval);
    }
	var vis = init(width, height, nodes, edges);
	redraw(vis);
});

}