var width = 840;
var height = 620;
var url = 'https://aviationaccident.info/accidents';
var selectYear = document.getElementById("selectYear");
var selectCountry = document.getElementById("selectCountry");
var selectCategory = document.getElementById("selectCategory");
var mapInfo = document.getElementById("mapInfo");
var allData;

window.onload = function () {
  drawMap();

}

selectYear.onchange = function () {
  filter();
}
selectCountry.onchange = function () {
  filter();
}
selectCategory.onchange = function () {
  filter();
}

function filter() {
  var filteredData = [];
  var i;

  svg.selectAll("g").remove();
  d3.select('#severity')[0][0].innerHTML = "";
  d3.select('#phaseOfFlight')[0][0].innerHTML = "";
  d3.select('#accidentsPerMonth')[0][0].innerHTML = "";
  d3.select('#flightType')[0][0].innerHTML = "";
  d3.select('#purposeOfFlight')[0][0].innerHTML = "";

  for (i = 0; i < window.allData.length; i++) {
    if (
      window.allData[i].eventdate.startsWith(selectYear.value) &&
      window.allData[i].country == selectCountry.value &&
      window.allData[i].aircraftcategory == selectCategory.value
    ) {
      filteredData.push(window.allData[i]);
    }
  }

  plotPoints(filteredData);
  severityPie(filteredData);
  flightTypePie(filteredData);
  phaseOfFlight(filteredData);
  accidentsPerMonth(filteredData);
  purposeOfFlight(filteredData);

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

function getCountry() {
  var lookup = {};
  result = [];

  for (var item, i = 0; item = window.allData[i++];) {
    var country = item.country;

    if (!(country in lookup)) {
      lookup[country] = 1;
      result.push(country);
    }
  }

  for (var i = 0; i < result.length; i++) {
    var opt = result[i];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    selectCountry.appendChild(el);
  }
}

function getCategory() {
  var lookup = {};
  result = [];

  for (var item, i = 0; item = window.allData[i++];) {
    var category = item.aircraftcategory;

    if (!(category in lookup)) {
      lookup[category] = 1;
      result.push(category);
    }
  }

  for (var i = 0; i < result.length; i++) {
    var opt = result[i];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    selectCategory.appendChild(el);
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
  getCountry();
  getCategory();
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
    d3.select("#map")
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
  //console.log(data);
  //console.log(data.length);
  document.getElementById("foldable").innerHTML = data.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " incidents";
  // Bind data to circles
  var points = svg.selectAll("g").data(data).enter().append("g");


  // Render the circles
  points.append("circle").attr("r", 0.8).attr("cx", function (d) {
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
    })
    // Remove info and flag on mouseout
    .on("mouseout", function () {
      d3.select(this).attr("r", function (d) {
        return d.radius;
      });
      d3.select(this).style("opacity", function (d) {
        return d.opacity;
      });
    })
    .on("click", function (d) {
      var data = d;
      var date = data.eventdate.split("T");
      if (data.aircarrier == null) {
        data.aircarrier = "Private";
      }
      mapInfo.innerHTML = "<strong>Location: </strong>" + data.location + " | <strong>Date: </strong>" + date[0] + " | <strong>Carrier: </strong>" + data.aircarrier + " | <strong>Total Injuries: </strong>" + (data.totalfatalinjuries + data.totalminorinjuries + data.totalseriousinjuries) + " | <strong>Amateur Built: </strong>" + data.amateurbuilt + " | <strong><a target='_blank' href='https://www.ntsb.gov/_layouts/ntsb.aviation/brief.aspx?ev_id=" + data.eventid + "&key=1'>NTSB Synopsis</a></strong>";
    });
}

function severityPie(filteredData) {

  var str = '{"label":"Fatal","value":0},{"label":"Non-Fatal","value":0}';
  var data = JSON.parse('[' + str + ']');
  var lookup = {};
  result = [];
  for (var item, i = 0; item = filteredData[i++];) {
    var injurySeverity = item.injuryseverity.split('(')[0];
    if (injurySeverity == "Fatal") {
      data[0].value++;
    } else if (injurySeverity == "Non-Fatal") {
      data[1].value++;
    }
  }
  //console.log(data);

  var width = 250,
    height = 250,
    radius = 100
  colors = d3.scale.ordinal()
    .range(['#3A4853', '#567897']);

  var pie = d3.layout.pie()
    .value(function (d) {
      return d.value;
    })

  var arc = d3.svg.arc()
    .outerRadius(radius)

  var myChart = d3.select('#severity').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + (width - radius) + ',' + (height - radius) + ')')
    .selectAll('path').data(pie(data))
    .enter().append('g')
    .attr('class', 'slice')

  var slices = d3.selectAll('g.slice')
    .append('path')
    .attr('fill', function (d, i) {
      return colors(i);
    })
    .attr('d', arc)


  var text = d3.selectAll('g.slice')
    .append('text')
    .text(function (d, i) {
      return (((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(0) + '%');
    })
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('transform', function (d) {
      d.innerRadius = 0;
      d.outerRadius = radius;
      return 'translate(' + arc.centroid(d) + ')'
    })
}


function flightTypePie(filteredData) {

  var str = '{"label":"Commercial","value":0},{"label":"Private","value":0}';
  var data = JSON.parse('[' + str + ']');
  var lookup = {};
  result = [];
  for (var item, i = 0; item = filteredData[i++];) {
    if (item.aircarrier == null) {
      data[1].value++;
    } else {
      data[0].value++;
    }
  }
  //console.log(data);

  var width = 250,
    height = 250,
    radius = 100
  colors = d3.scale.ordinal()
    .range(['#3A4853', '#567897']);

  var pie = d3.layout.pie()
    .value(function (d) {
      return d.value;
    })

  var arc = d3.svg.arc()
    .outerRadius(radius)

  var myChart = d3.select('#flightType').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + (width - radius) + ',' + (height - radius) + ')')
    .selectAll('path').data(pie(data))
    .enter().append('g')
    .attr('class', 'slice')

  var slices = d3.selectAll('g.slice')
    .append('path')
    .attr('fill', function (d, i) {
      return colors(i);
    })
    .attr('d', arc)


  var text = d3.selectAll('g.slice')
    .append('text')
    .text(function (d, i) {
      return (((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(0) + '%');
    })
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('transform', function (d) {
      d.innerRadius = 0;
      d.outerRadius = radius;
      return 'translate(' + arc.centroid(d) + ')'
    })
}

function accidentsPerMonth(filteredData) {

  var str = '{"month":"January","value":0},{"month":"February","value":0},{"month":"March","value":0},{"month":"April","value":0},{"month":"May","value":0},{"month":"June","value":0},{"month":"July","value":0},{"month":"August","value":0},{"month":"September","value":0},{"month":"October","value":0},{"month":"November","value":0},{"month":"December","value":0}';
  var data = JSON.parse('[' + str + ']');
  var lookup = {};
  result = [];
  for (var item, i = 0; item = filteredData[i++];) {
    switch (item.eventdate.split('-')[1]) {
      case "01":
        data[0].value++;
        break;
      case "02":
        data[1].value++;
        break;
      case "03":
        data[2].value++;
        break;
      case "04":
        data[3].value++;
        break;
      case "05":
        data[4].value++;
        break;
      case "06":
        data[5].value++;
        break;
      case "07":
        data[6].value++;
        break;
      case "08":
        data[7].value++;
        break;
      case "09":
        data[8].value++;
        break;
      case "10":
        data[9].value++;
        break;
      case "11":
        data[10].value++;
        break;
      case "12":
        data[11].value++;
        break;
    }
  }
  var vis = d3.select('#accidentsPerMonth'),
    WIDTH = 500,
    HEIGHT = 250,
    MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 50
    },
    xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(data.map(function (d) {
      return d.month;
    })),

    yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
      d3.max(data, function (d) {
        return d.value;
      })
    ]),

    ordinal = d3.scale.ordinal()
    .domain([1, 2, 3, 4, 5, 6])
    .rangePoints([0, d3.max(data, function (d) {
      return d.value
    })]),

    xAxis = d3.svg.axis()
    .scale(xRange)
    .tickSize(5)
    .tickSubdivide(true),

    yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(5)
    .orient("left")
    .tickFormat(function (d) {
      return d3.format(",.0f")(d);
    })
    .tickSubdivide(true)
    .tickValues(ordinal.range());

  var line = d3.svg.line()
    .x(function (d) {
      return xRange(d.month);
    })
    .y(function (d) {
      return yRange(d.value);
    });
    

  vis.append('svg:g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
    .call(xAxis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

  vis.append('svg:g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
    .call(yAxis);  
  
  var bar = vis.selectAll('rect')
    .data(data)
    .enter();

  var barRect = bar.append('rect')
    .attr('class', 'bar')
    .attr('x', function (d) {
      //return xRange(d.month);
      return xRange(d.month) + xRange.rangeBand() / 4;
    })
    .attr('y', function (d) {
      return HEIGHT - MARGINS.bottom;
    })
    .attr('width', 10)
    .attr('height', 0);

  function initAnimation() {
    barRect.transition()
      .duration(750)
      .attr('height', function (d) {
        return ((HEIGHT - MARGINS.bottom) - yRange(d.value));
      })
      .attr('y', function (d) {
        return yRange(d.value);
      })
  }
  initAnimation();

}

function phaseOfFlight(filteredData) {

  var str = '{"broadphaseofflight":"APPROACH","value":0},{"broadphaseofflight":"CLIMB","value":0},{"broadphaseofflight":"CRUISE","value":0},{"broadphaseofflight":"DESCENT","value":0},{"broadphaseofflight":"GO-AROUND","value":0},{"broadphaseofflight":"LANDING","value":0},{"broadphaseofflight":"MANEUVERING","value":0},{"broadphaseofflight":"STANDING","value":0},{"broadphaseofflight":"TAKEOFF","value":0},{"broadphaseofflight":"TAXI","value":0},{"broadphaseofflight":"OTHER","value":0},{"broadphaseofflight":"UNKNOWN","value":0}';
  var data = JSON.parse('[' + str + ']');
  var lookup = {};
  result = [];
  for (var item, i = 0; item = filteredData[i++];) {
    switch (item.broadphaseofflight) {
      case "APPROACH":
        data[0].value++;
        break;
      case "CLIMB":
        data[1].value++;
        break;
      case "CRUISE":
        data[2].value++;
        break;
      case "DESCENT":
        data[3].value++;
        break;
      case "GO-AROUND":
        data[4].value++;
        break;
      case "LANDING":
        data[5].value++;
        break;
      case "MANEUVERING":
        data[6].value++;
        break;
      case "STANDING":
        data[7].value++;
        break;
      case "TAKEOFF":
        data[8].value++;
        break;
      case "TAXI":
        data[9].value++;
        break;
      case "OTHER":
        data[10].value++;
        break;
      case "UNKNOWN":
        data[11].value++;
        break;
      case null:
        data[11].value++;
        break;
    }
  }
  var vis = d3.select('#phaseOfFlight'),
    WIDTH = 500,
    HEIGHT = 250,
    MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 50
    },
    xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(data.map(function (d) {
      return d.broadphaseofflight;
    })),

    yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
      d3.max(data, function (d) {
        return d.value;
      })
    ]),

    ordinal = d3.scale.ordinal()
    .domain([1, 2, 3, 4, 5, 6])
    .rangePoints([0, d3.max(data, function (d) {
      return d.value
    })]),

    xAxis = d3.svg.axis()
    .scale(xRange)
    .tickSize(5)
    .tickSubdivide(true),

    yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(5)
    .orient("left")
    .tickFormat(function (d) {
      return d3.format(",.0f")(d);
    })
    .tickSubdivide(true)
    .tickValues(ordinal.range());

  var line = d3.svg.line()
    .x(function (d) {
      return xRange(d.broadphaseofflight);
    })
    .y(function (d) {
      return yRange(d.value);
    });

  vis.append('svg:g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
    .call(xAxis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

  vis.append('svg:g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
    .call(yAxis);  
  
  var bar = vis.selectAll('rect')
    .data(data)
    .enter();

  var barRect = bar.append('rect')
    .attr('class', 'bar')
    .attr('x', function (d) {
      //return xRange(d.broadphaseofflight);
      return xRange(d.broadphaseofflight) + xRange.rangeBand() / 4;
    })
    .attr('y', function (d) {
      return HEIGHT - MARGINS.bottom;
    })
    .attr('width', 10)
    .attr('height', 0);

  function initAnimation() {
    barRect.transition()
      .duration(750)
      .attr('height', function (d) {
        return ((HEIGHT - MARGINS.bottom) - yRange(d.value));
      })
      .attr('y', function (d) {
        return yRange(d.value);
      })
  }
  initAnimation();

}

function purposeOfFlight(filteredData) {

  var str = '{"purposeofflight":"Aerial Application","value":0},{"purposeofflight":"Aerial Observation","value":0},{"purposeofflight":"Business","value":0},{"purposeofflight":"Flight Test","value":0},{"purposeofflight":"Instructional","value":0},{"purposeofflight":"Personal","value":0},{"purposeofflight":"Positioning","value":0},{"purposeofflight":"Other","value":0}';
  var data = JSON.parse('[' + str + ']');
  var lookup = {};
  result = [];
  for (var item, i = 0; item = filteredData[i++];) {
    switch (item.purposeofflight) {
      case "Aerial Application":
        data[0].value++;
        break;
      case "Aerial Observation":
        data[1].value++;
        break;
      case "Business":
        data[2].value++;
        break;
      case "Flight Test":
        data[3].value++;
        break;
      case "Instructional":
        data[4].value++;
        break;
      case "Personal":
        data[5].value++;
        break;
      case "Positioning":
        data[6].value++;
        break;
      default:
        data[7].value++;
        break;
    }
  }
  var vis = d3.select('#purposeOfFlight'),
    WIDTH = 500,
    HEIGHT = 250,
    MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 50
    },
    xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(data.map(function (d) {
      return d.purposeofflight;
    })),

    yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
      d3.max(data, function (d) {
        return d.value;
      })
    ]),

    ordinal = d3.scale.ordinal()
    .domain([1, 2, 3, 4, 5, 6])
    .rangePoints([0, d3.max(data, function (d) {
      return d.value
    })]),

    xAxis = d3.svg.axis()
    .scale(xRange)
    .tickSize(5)
    .tickSubdivide(true),

    yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(5)
    .orient("left")
    .tickFormat(function (d) {
      return d3.format(",.0f")(d);
    })
    .tickSubdivide(true)
    .tickValues(ordinal.range());

  var line = d3.svg.line()
    .x(function (d) {
      return xRange(d.purposeofflight);
    })
    .y(function (d) {
      return yRange(d.value);
    });

  vis.append('svg:g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
    .call(xAxis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

  vis.append('svg:g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
    .call(yAxis);   
  
  var bar = vis.selectAll('rect')
    .data(data)
    .enter();

  var barRect = bar.append('rect')
    .attr('class', 'bar')
    .attr('x', function (d) {
      //return xRange(d.purposeofflight);
      return xRange(d.purposeofflight) + xRange.rangeBand() / 4;
    })
    .attr('y', function (d) {
      return HEIGHT - MARGINS.bottom;
    })
    .attr('width', 10)
    .attr('height', 0);

  function initAnimation() {
    barRect.transition()
      .duration(750)
      .attr('height', function (d) {
        return ((HEIGHT - MARGINS.bottom) - yRange(d.value));
      })
      .attr('y', function (d) {
        return yRange(d.value);
      })
  }
  initAnimation();

}