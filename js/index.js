var width = 840;
var height = 620;
var url = 'http://174.138.68.14:3000/accidents';
var selectYear = document.getElementById("selectYear");
var allData;

window.onload = function () {
  drawMap();
}

selectYear.onchange = function () {
  filter();
}

function filter() {
  var filteredData = [];
  var i;

  svg.selectAll("g").remove();

  for (i = 0; i < window.allData.length; i++) {
    if (window.allData[i].eventdate.startsWith(selectYear.value)) {
      filteredData.push(window.allData[i]);
    }
  }

  plotPoints(filteredData);

}

function getYears() {
  var lookup = {};
  result = [];

  for (var item, i = 0; item = window.allData[i++];) {
    var eventdate = parseInt(item.eventdate);

    if (!(eventdate in lookup)) {
      lookup[eventdate] = 1;
      result.push(eventdate);
    }
  }

  for (var i = 0; i < result.length; i++) {
    var opt = result[i];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    selectYear.appendChild(el);
  }
}

//JSON Fetch from @malyw
var processStatus = function (response) {
  if (response.status === 200 || response.status === 0) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
};

var MAX_WAITING_TIME = 5000; // in ms

var parseJson = function (response) {
  return response.json();
};

/* @returns {wrapped Promise} with .resolve/.reject/.catch methods */
var getWrappedPromise = function () {
  var wrappedPromise = {},
    promise = new Promise(function (resolve, reject) {
      wrappedPromise.resolve = resolve;
      wrappedPromise.reject = reject;
    });
  wrappedPromise.then = promise.then.bind(promise);
  wrappedPromise.catch = promise.catch.bind(promise);
  wrappedPromise.promise = promise; // e.g. if you want to provide somewhere only promise, without .resolve/.reject/.catch methods
  return wrappedPromise;
};

/* @returns {wrapped Promise} with .resolve/.reject/.catch methods */
var getWrappedFetch = function () {
  var wrappedPromise = getWrappedPromise();
  var args = Array.prototype.slice.call(arguments); // arguments to Array

  fetch.apply(null, args) // calling original fetch() method
    .then(function (response) {
      wrappedPromise.resolve(response);
    }, function (error) {
      wrappedPromise.reject(error);
    })
    .catch(function (error) {
      wrappedPromise.catch(error);
    });
  return wrappedPromise;
};

/**
 * Fetch JSON by url
 * @param { {
 *  url: {String},
 *  [cacheBusting]: {Boolean}
 * } } params
 * @returns {Promise}
 */
var getJSON = function (params) {
  var wrappedFetch = getWrappedFetch(
    params.cacheBusting ? params.url + '?' : params.url, {
      method: 'get', // optional, "GET" is default value
      headers: {
        'Accept': 'application/json'
      }
    });

  var timeoutId = setTimeout(function () {
    wrappedFetch.reject(new Error('Load timeout for resource: ' + params.url)); // reject on timeout
  }, MAX_WAITING_TIME);

  return wrappedFetch.promise // getting clear promise from wrapped
    .then(function (response) {
      clearTimeout(timeoutId);
      return response;
    })
    .then(processStatus)
    .then(parseJson);
};

var onComplete = function () {
  console.log('I\'m invoked in any case after success/error');
};

getJSON({
  url: url,
  cacheBusting: true
}).then(function (data) { // on success
  //console.log('JSON parsed successfully!');
  //console.log(data);
  //plotPoints(data);
  allData = data;
  getYears();
  filter();
  //onComplete(data);
}, function (error) { // on reject
  console.error('An error occured!');
  console.error(error.message ? error.message : error);
  onComplete(error);
});


function drawMap() {
  // Add #container div, with #svg-container nested
  // This allows the svg to use preserveAspectRatio
  // and viewBox to make the svg responsive
  svg =
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
  tooltip =
    d3.select("span")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Define projection
  projection = d3.geo.mercator().translate([width / 2, height / 2.6]);
  // Define path generator
  path = d3.geo.path().projection(projection);

  // Get data and render map with callback
  d3.json("https://raw.githubusercontent.com/moigithub/d3maplayout/master/world-50m.json", function (error, data) {
    if (error) return console.log("error retrieving json");

    // Get feature collection of world map
    subunits = topojson.feature(data, data.objects.countries);

    // Render path
    svg.append("path").datum(subunits).attr("d", path);

    // Create .subunit paths of each country
    svg.selectAll(".subunit")
      .data(topojson.feature(data, data.objects.countries).features)
      .enter()
      .append("path").attr("class", "subunit")
      .attr("d", path);

    zoom =
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
}

function plotPoints(data) {
  //console.log(data.length);
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
      tooltip.html("<h2 class='title'>" + data.location + "</h2>" + "<h3>" + data.country + "</h3>" + data.accidentnumber + "<br />");
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
}