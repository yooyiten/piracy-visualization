window.onload = function() {

	// global json variables
	var fora;
	var mainforums;
	var subforums;
	var stories;

	// set up dimensions
	var width = 900;
	var height = 350;

	// forum color scale
	var fcolor = d3.scale.linear()
		.domain([20000,
				 10000,
				 1500,
				 1000,
				 500,
				 300,
				 200,
				 100,
				 50,
				 0])
		.range(colorbrewer.RdYlBu[9]);

	var quarters = [
		"Q4_2005",
		"Q1_2006",
		"Q2_2006",
		"Q3_2006",
		"Q4_2006",
		"Q1_2007",
		"Q2_2007",
		"Q3_2007",
		"Q4_2007",
		"Q1_2008",
		"Q2_2008",
		"Q3_2008",
		"Q4_2008",
		"Q1_2009",
		"Q2_2009",
		"Q3_2009",
		"Q4_2009",
		"Q1_2010",
		"Q2_2010",
		"Q3_2010",
		"Q4_2010",
		"Q1_2011",
		"Q2_2011",
		"Q3_2011",
		"Q4_2011",
		"Q1_2012",
		"Q2_2012",
		"Q3_2012",
		"Q4_2012",
		"Q1_2013",
		"total_seeds"
				    ];

	// toggles
	var playtoggle = false;
	var sftoggle = false;

d3.json("data/fora.json", function(error, json) {
	if (error) return console.warn(error);
	
	fora = json;
	mainforums = fora.forums;
	subforums = fora.subforums;
	stories = fora.stories;

	// initialize the visualization per theory.info demo
	// example at http://theory.info/visuals/plotting-functions
	function init(w, h, mfdata, sfdata, stodata, qtrs) {
	    // set up the svg
	    var cont = d3.select("body").insert("div")
	    	.attr("class", "cont");

		var svg = cont.append("svg")
	    	.attr("width", w)
	    	.attr("height", h);

	    return {svg : svg, mfdata: mfdata, sfdata: sfdata, stodata: stodata, qtrs: qtrs};
	}

	function redraw(v) {
		drawmap(v, v.qtrs[30]);
		drawslider(v);
	}

	// draw the time slider
	function drawslider(v) {
	// autoplay based on tutorial at http://www.w3schools.com/jsref/met_win_setinterval.asp
	var interval;
		$("#playbutton").button()
			.on("click", function() { 
							if (!playtoggle)
								interval = self.setInterval(autoplay, 2000); });

		$("#pausebutton").button()
			.on("click", function() { playtoggle = false; interval = window.clearInterval(interval); });

		$("#time_slide").slider({  
									min: 0, 
									max: (v.qtrs.length - 1), 
									step: 1, 
									value: 30})
						.on("slidechange", function(event, ui) { 
												$("#slidetxt").html((v.qtrs[ui.value]).replace("_"," "));
												drawmap(v, v.qtrs[ui.value]); 
										   		refreshstory(v, v.qtrs[ui.value]); });
	}

	// autoplay the slider
	function autoplay() {
			var i = $("#time_slide").slider("option", "value");
			if ((playtoggle) && (i == 30)) {
				$("#pausebutton").click();}
			else {
				var next = (i < 30 ? i + 1 : 0);
				playtoggle = (next <= 30 ? true : false);
				$("#time_slide").slider("option", "value", next);}
	}

	// draw the heatmap
	function drawmap(v, q) {
		var seeds = new Array();	
		var quarter = q; 

		// for (i = 0; i < v.mfdata.length; i++)
		// 	seeds.push(parseInt(v.mfdata[i][quarter]));
		// 	console.log(d3.min(seeds));
		// 	console.log(d3.max(seeds));

		v.svg.selectAll("rect")
			.remove();

		d3.selectAll(".pie")
			.remove();

		v.svg.selectAll(".forum")
			.data(v.mfdata)
			.enter().append("rect")
				.attr("id", function(d, i) { return "mainforum" + i; })
				.attr("width", 100)
				.attr("height", 100)
				.attr("fill", function(d, i) { return fcolor(d[quarter]); })
				.attr("y", function(d, i) { 
							if (i <= 2)
								return i * 110 + 10;
						    else if (i > 2 && i <= 5)
						    	return (i - 3) * 110 + 10;
						    else if (i > 5 && i <= 8)
						    	return (i - 6) * 110 + 10; 
							else if (i > 8 && i <=11)
								return (i - 9) * 110 + 10;
							else if (i > 11)
								return (i - 12) * 110 + 10; })
				.attr("x", function(d, i) { 
							if (i <= 4)
								return i * 110 + 10;
						    else if (i > 4 && i <= 9)
						    	return (i - 5) * 110 + 10;
						    else if (i > 9)
						    	return (i - 10) * 110 + 10; })
				.on("click", function(d, i) { 
								sftoggle = true; 
								hidesqtip();
								if (d[quarter] != "0") {
									$("#pausebutton").click();
									drawpie(d, quarter, v);
								} })
				.on("mouseover.light", highlightsquare)
				.on("mouseout.light", dimsquare)
				.on("mouseover.line", function(d, i) { drawline(d, i, v); })
				.on("mousemove.tip", function(d, i) { displaysqtip(d, i, quarter, d3.mouse(this)); })
				.on("mouseout.tip", hidesqtip);
	}

	// draw the pie
	// referred to mbostock's pie chart example at http://bl.ocks.org/mbostock/3887235
	function drawpie(d, quarter, v) {	
		var subs = new Array();
		
        for (var i = 0; i < v.sfdata.length; i++) {
        	if (v.sfdata[i].forum == d.forum && v.sfdata[i][quarter] != "0") 
        		subs.push([v.sfdata[i].subforum, v.sfdata[i][quarter]]);
        }

		v.svg.selectAll("rect")
			.remove();

		d3.selectAll(".pie")
			.remove();

		var r = 170;

		var arc = d3.svg.arc()
			.outerRadius(r)
			.innerRadius(0);

		var pie = d3.layout.pie()
			.value(function(d) { return d[1]; });

		var chart = d3.select("body").append("svg")
			.attr("width", v.w)
			.attr("height", v.h)
			.attr("class", "pie")
			.append("g")
			.attr("transform", "translate(" + r + "," + r + ")");

		chart.append("text")
			.text("Click pie to return to map")
			.attr("x", 130)
			.attr("y", 150);

		var g = chart.selectAll(".arc")
			.data(pie(subs))
			.enter()
			.append("g")
				.attr("class", "arc")
				.on("click", function(d2, i2) { 
								sftoggle = false; 
								hidesltip();
								drawmap(v, quarter); })
				.on("mouseover.light", highlightslice)
				.on("mouseout.light", dimslice)   
				.on("mousemove.tip", function(d2, i2) { displaysltip(d2, i2, quarter, d3.mouse(this)); })
				.on("mouseout.tip", hidesltip);

		g.append("path")
			.attr("d", arc)
			.attr("class", "slice")
			.attr("id", function(d2, i2) { return "path" + i2; })
			.style("stroke", "#ffffff")
			.style("fill", function(d2) { return fcolor(d2.data[1]); });
	}

	function drawline(d, i, v) {
		d3.selectAll(".graph")
			.remove();

		var coords = new Array();

		for (var i = 0; i < (v.qtrs.length - 1); i++) {
				var q = v.qtrs[i];
					coords.push([i, parseInt(d[q])]);
		}	

		var margin = {top: 20, right: 20, bottom: 50, left: 50},
			width = 350 - margin.left - margin.right,
			height = 350 - margin.top - margin.bottom;

		var x = d3.scale.linear()
			.range([0, width]);

		var y = d3.scale.linear()
			.range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.tickValues([])
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");

		var line = d3.svg.line()
			.x(function(d2) { return x(d2[0]); })
			.y(function(d2) { return y(d2[1]); })

		var graph = d3.select("body").append("svg")
    					.attr("class", "graph")
    					.append("g")
    					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    	x.domain(d3.extent(coords, function(d2) { return d2[0]; }));
    	y.domain([0, 1800]); 	

    	graph.append("g")
    		.attr("class", "x.axis")
    		.attr("transform", "translate(0," + height + ")")
    		.call(xAxis)
    		.append("text")
    		.attr("x", 50)
    		.attr("dx", ".71em")
    		.attr("y", 15)
    		.text("Q4 2005 through Q1 2013")

    	graph.append("g")
    		.attr("class", "y.axis")
    		.call(yAxis)
    		.append("text")
    		.attr("transform", "rotate(-90)")
    		.attr("y", 6)
    		.attr("dy", ".71em")
    		.style("text-anchor", "end")
    		.text("Seeds over time");

    	graph.append("path")
    		.datum(coords)
    		.attr("class", "line")
    		.attr("d", line);   		

    	d3.selectAll("#graphlbl")
    		.html(d.forum);		
	}

	function highlightsquare(d, i) {
		d3.select("#mainforum" + i)
			.style("stroke", "#000000")
			.style("stroke-opacity", ".6")
			.style("stroke-width", "8px");
	}

	function dimsquare(d, i) {
		d3.select("#mainforum" + i)
			.style("stroke", "none")
			.style("stroke-width", "none");
	}

	function highlightslice(d, i) {
		d3.selectAll(".slice")
			.filter(function(d2, i2) { return i != i2; })
			.style("fill", "#EEEEEE");
	}

	function dimslice(d, i) {
		d3.selectAll(".slice")
			.style("fill", function(d) { return fcolor(d.data[1]); });
	}

	// displays forum tooltip
	function displaysqtip(d, i, qtr, coords) {
		hidesqtip(d, i);
		var sq = document.getElementsByTagName("rect")[i];

		var xval = coords[0];
		var yval = coords[1];

		if (sq.style.display != "none") {
    		x = xval + 50;
  			y = yval + 250;	

  			d3.select("body")
				.append("div")
    			.attr("class", "forumtip")
    			.attr("style", "top : " + y + "px; " + "left : " + x + "px;")
    			.html(function() { 
    					if (qtr == "total_seeds") {
    						return "<b>" + d.forum + "</b><br />" +
    				  			   "Total seeds: " + d[qtr] + "<br />" +
    				  			   "Total size: " + d.total_size; }
    				    else {
    				    	return "<b>" + d.forum + "</b><br />" +
    				 			   "Seeds in " + qtr.replace("_", " ") + ": " + d[qtr]; } });			
		}
	}

	// removes forum tooltip
	function hidesqtip(d, i) {
		d3.selectAll(".forumtip")
    		.remove();
	}

	// displays subforum tooltip
	function displaysltip(d, i, qtr, coords) {
		hidesltip(d, i);

		var sl = document.getElementsByTagName("path")[i];

		var xval = coords[0];
		var yval = coords[1];

		if (sl.style.display != "none") {
    		x = xval + 320;
  			y = yval + 440;	

  			d3.select("body")
				.append("div")
    			.attr("class", "forumtip")
    			.attr("style", "top : " + y + "px; " + "left : " + x + "px;")
    			.html(function() { 
    					if (qtr == "total_seeds") {
    						return "<b>" + d.data[0] + "</b><br />" +
    				  			   "Total seeds: " + d.data[1]; }
    				    else {
    				    	return "<b>" + d.data[0] + "</b><br />" +
    				 			   "Seeds in " + qtr.replace("_", " ") + ": " + d.data[1]; } });			
		}
	}

	// removes subforum tooltip
	function hidesltip(d, i) {
		d3.selectAll(".forumtip")
    		.remove();
	}

	function refreshstory(v, q) {
		removestory();

		d3.select("body")
			.append("div")
			.attr("class", "story")
			.html(v.stodata[0][q]);
	}

	function removestory() {
		d3.selectAll(".story")
			.remove();
	}

	var vis = init(width, height, mainforums, subforums, stories, quarters);
	redraw(vis);
});

}