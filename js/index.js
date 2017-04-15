var width = 840,
  height = 620;

var accidents = "http://174.138.68.14:3000/accidents?amateurbuilt=eq.Yes&publicationdate=gt.2016-04-04";



// Add #container div, with #svg-container nested
// This allows the svg to use preserveAspectRatio
// and viewBox to make the svg responsive
var svg = 
  d3.select("span")
  .append("div")
  .attr("id", "container")
  .append("div")
  .attr("id", "svg-container")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 " + width + " " + height)
  .attr("id", "svg-content-responsive")
  .call(d3.behavior.zoom().on("zoom", function () {
    svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
  }))
  .append("g");

// Define the tooltip
var tooltip = 
  d3.select("span")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Define projection
var projection = d3.geo.mercator().translate([width / 2, height / 2.6]);
// Define path generator
var path = d3.geo.path().projection(projection);

// Get data and render map with callback
d3.json("https://raw.githubusercontent.com/moigithub/d3maplayout/master/world-50m.json", function (error, data) {
  if (error) return console.log("error retrieving json");

  // Get feature collection of world map
  var subunits = topojson.feature(data, data.objects.countries);

  // Render path
  svg.append("path").datum(subunits).attr("d", path);

  // Create .subunit paths of each country
  svg.selectAll(".subunit")
  .data(topojson.feature(data, data.objects.countries).features)
  .enter()
  .append("path").attr("class", "subunit")
  .attr("d", path);

  d3.json(accidents, function (error, data) {
    if (error) return console.log("error fetching accident JSON");
document.getElementById("foldable").innerHTML = data.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " incidents";
    // Bind data to circles
    var points = svg.selectAll("g").data(data).enter().append("g");


    // Render the circles
    points.append("circle").attr("r", .7).attr("cx", function (d) {
        var coords = [d.longitude, d.latitude];
        if (coords) {
          return projection(coords)[0];
        }
      }).attr("cy", function (d) {
        var coords = [d.longitude, d.latitude];
        if (coords) {
          return projection(coords)[1];
        }
      }).style("opacity", 1)
      // Add info on mouse over, plus transition styles
      .on("mouseover", function (d) {
        // Add radius and opacity to circle data, then transition to 4 times as big
        // Returns to normal on mouseOut
        d.radius = d3.select(this).attr("r");
        d.opacity = d3.select(this).style("opacity");
        d3.select(this).attr("r", function (d) {
          return d.radius * 4;
        });
        d3.select(this).style("opacity", 1);
        var data = d;
        // Convert time data to year
        //var year = yearFormat(new Date(data.year));
        tooltip.transition().duration(200).style("opacity", 1);
        // Add text to .tooltip
        tooltip.html("<h2 class='title'>" + data.location + "</h2>" + "<h3>" + data.country + "</h3>"  + data.accidentnumber + "<br />");
        // Check if tooltip is too close to right side of page, remove by toolwidth length if it is
        if (d3.event.pageX + 260 > window.innerWidth) {
          tooltip.style("left", d3.event.pageX - tooltip.style("width").replace(/[px]/g, '') + "px");
        } else {
          tooltip.style("left", d3.event.pageX + "px");
        }
        tooltip.style("top", d3.event.pageY - 18 + "px");
      })
      // Remove info and flag on mouseout
      .on("mouseout", function () {
        d3.select(this).attr("r", function (d) {
          return d.radius;
        });
        d3.select(this).style("opacity", function (d) {
          return d.opacity;
        });
        tooltip.transition().duration(200).style("opacity", 0);
      });
  });

  var zoom =
    d3.behavior.zoom()
    .translate(projection.translate())
    .scale(projection.scale())
    .scaleExtent([height, 8 * height])
    .on("zoom", zoomed);

  function clicked(d) {
    var centroid = path.centroid(d),
      translate = projection.translate();

    projection.translate([translate[0] - centroid[0] + width / 2, translate[1] - centroid[1] + height / 2]);

    zoom.translate(projection.translate());

    g.selectAll("path").transition().duration(700);
  }

  function zoomed() {
    projection.translate(d3.event.translate).scale(d3.event.scale);
    g.selectAll("path");
  }
});