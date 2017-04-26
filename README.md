# Aviation Accident Dashboard Developer Information

## API

The original dataset is available from the NTSB's website in XML format - https://www.ntsb.gov/_layouts/ntsb.aviation/index.aspx

As part of this project, a JSON API has been created with Postgres and PostGrest and is publicly available to use. 

All API access is over HTTP, and accessed from the https://aviationaccident.info/accidents. All data is sent and 
received as JSON.

### Schema
By default a request to the API sends all attributes of an accident.

``GET accidents``

```json
[
  {
    "broadphaseofflight": null,
    "make": "HUGHES WILLIAM J",
    "totalseriousinjuries": 1,
    "location": "Garden Ridge, TX",
    "latitude": 29.625278,
    "accidentnumber": "CEN17LA149",
    "enginetype": "Reciprocating",
    "airportname": "Kitty Hawk Flying Field",
    "purposeofflight": "Personal",
    "amateurbuilt": "Yes",
    "weathercondition": "VMC",
    "schedule": null,
    "fardescription": "Part 91: General Aviation",
    "totaluninjured": null,
    "aircraftcategory": "Airplane",
    "totalminorinjuries": null,
    "reportstatus": "Preliminary",
    "numberofengines": 1,
    "publicationdate": "2017-04-10T00:00:00",
    "aircraftdamage": "Substantial",
    "eventid": "20170410X00359",
    "country": "United States",
    "longitude": -98.278056,
    "registrationnumber": "N580TX",
    "model": "AVENTURA UL",
    "aircarrier": null,
    "investigationtype": "Accident",
    "airportcode": "TS67",
    "injuryseverity": "Non-Fatal",
    "totalfatalinjuries": null,
    "eventdate": "2017-04-03T00:00:00"
  }
]
```

### Attributes

- ``accidentnumber``: String - Primary identifier inherited from the NTSB
- ``aircarrier``: String - Company responsible for the aircraft
- ``aircraftcategory``: String - Type of aircraft being flown (Airplane, Helicopter, etc.)
- ``aircraftdamage``: String - 
- ``airportcode``: String - IATA airport code designating the airport from which the flight originated
- ``airportname``: String - Name of the airport from which the flight originated
- ``amateurbuilt``: Boolean - Designates if the aircraft was built by an amateur
- ``broadphaseofflight``: String - The phast of the flight in which the accident occured
- ``country``: String - The country of origin
- ``enginetype``: String - Type of engine inthe aircraft
- ``eventdate``: Date - date of the incident
- ``eventid``: String - id used to identify the event in the NTSB's database
- ``fardescription``: String - Short description describing the cause of the accident
- ``injuryseverity``: String - Fatal or Non-Fatal
- ``investigationtype``: String - Incident or Accident
- ``latitude``: String - Coordinates of the event
- ``location``: String - City and region of the event
- ``longitude``: String - Coordinates of the event
- ``make``: String - Make of the aircraft
- ``model``: String - Model of aircraft
- ``numberofengines``: String - Number of engines on the aircraft
- ``publicationdate``: Date - Date the NTSB published information on the event
- ``purposeofflight``: String - Purpose of the flight (Instructional, Personal etc.)
- ``registrationnumber``: String - The registration number of the aircraft
- ``reportstatus``: String - The status of the NTSBs investication of the event
- ``schedule``: String - Scheduled or Non-Scheduled
- ``totalfatalinjuries``: Int - Number of fatalities 
- ``totalminorinjuries``: Int - Number of minor injuries
- ``totalseriousinjuries``: Int - Number of serious injuries
- ``totaluninjured``: String - Number of uninjured passengers
- ``weathercondition``: String - Weather at the time the incident occured

### Horizontal Filtering

Rows can be filtered by adding conditions on columns, each condition a query string parameter. For instance, to return aircraft with more thatn 1 engine:

``GET /accidents?numberofengines=gt.1 HTTP/1.1``

Adding multiple parameters conjoins the conditions:

``GET /accidents?numberofengines=gt.1&airportcode=eq.IAD HTTP/1.1``

#### Operators
- **eq**:	equals
- **gte**:	greater than or equal
- **gt**:	greater than
- **lte**:	less than or equal
- **lt**:	less than
- **neq**:	not equal
- **like**:	LIKE operator (use * in place of %)
- **ilike**:	ILIKE operator (use * in place of %)
- **in**:	one of a list of values e.g. ``?a=in.1,2,3``
- **is**:	checking for exact equality (null,true,false)
- **@@**:	full-text search using to_tsquery
- **@>**:	contains e.g. ``?tags=@>.{example, new}``
- **<@**:	contained in e.g. ``?values=<@{1,2,3}``
- **not**:	negates another operator, see below

### Vertical Filtering

If it is not necessary to return all attributes vertical filtering can be used to restrict the returned values.

``GET /accidents?select=latitude,longitude HTTP/1.1``

### Ordering

Results can be ordered by attribute values.

``GET /accidents?order=eventdate.desc,publicationdate.asc HTTP/1.1``

If no direction is specified it defaults to ascending order:

``GET /accidents?order=eventdate HTTP/1.1``

Null orders can also be sorted. Add ``nullsfirst`` or ``nullslast``:

``GET /accidents?order=eventdate.nullsfirst HTTP/1.1``

``GET /accidents?order=eventdate.desc.nullslast HTTP/1.1``

### Limits and Pagination

HTTP range headers can be used to describe the size of results. Every response contains the current range and, if requested, the total number of results:

```http
HTTP/1.1 200 OK
Range-Unit: items
Content-Range: 0-14/*
```

You may also request open-ended ranges for an offset with no limit, e.g. ``Range: 10-.``

The other way to request a limit or offset is with query parameters. For example

``GET /accidents?limit=15&offset=30 HTTP/1.1``

### Deletes and Inserts
Deletes and Inserts are not permitted.


Additional API documentation available from PostGrest - https://postgrest.com

## CSS

### Grid

The for the dashboard is not based on any framework. Instead it is built from scratch using flexbox. Flexbox is supported in all current browsers. Internet Explorer 11+ - http://caniuse.com/#feat=flexbox

#### Classes

All content exists within the ``.container`` class which sets the display to ``flex``.

In order to form the grid inside the container. Divs should be defined with a class of ``.box`` and given one of the below sizes.

These sizes automatically set the box to take up a percentage of the screen. 

- ``.size100``: 100% of the container
- ``.size75``: 3/4 of the container
- ``.size66``: 2/3 of the container
- ``.size50``: 1/2 of the container
- ``.size33``: 1/3 of the container
- ``.size25``: 1/4 of the container

These predefined classes automatically break to several lines in order to accomodate smaller devices sizes. For example, if two boxes are given the ``.size50`` class, they will be on the same line on larger screen sizes. As the viewport decreases the two boxes will remain on the same line until their content becomes too large for their container, at this point they will break to separate lines and be shown one after the other.

### Linting
The styles in this ``style.css`` file will be linted using the NPM package ``csslint``. This will help to ensure a standard across the entire file.

- https://github.com/CSSLint/csslint

### External Libraries
The only external CSS that is imported is ``normalize.css`` which allows for greater consistency across browsers. https://necolas.github.io/normalize.css/

## JS

### Functions

#### getJSON()

This function is responsible for making the inital request to the API. On success the function stores the downloaded JSON into a global variable that can be accessed by all other functions. On failure the function returns a message asking the user to refresh the page. Depending on the size of the data requested and the user's internet speed, this function can take several minutes to run. As a result a loading screen is displayed until the function has been run. This function is run at ``onload`` in order to start the download as soon as possible.

The completion of this function triggers the execution of ``filter()`` and the Select Options Functions

#### Select Options Functions

These functions are responsible for parsing through the JSON object in order to determine the options that should be available in the dropdown boxes. As of the time of this writing the filter options are:

- ``getYears()``
- ``getCarrier()``
- ``getCountry()``
- ``getAircraftCategory()``

All of these functions work essentially the same. They loop through the JSON array looking at all the values for their respective attribute. They write these values to a new array until the array contains all of the options that attribute could be set to.

Once out of the loop, they write each item in the array to a ``<option>`` element on the respective ``<select>`` element.

#### filter()

This function is responsible for filtering the data that is used by the data visualizations to only include the pieces specified by the select boxes.

When executed it removes any existing SVGs that were previously created by D3. It then gets the current value of each of the filter and loops through the array finding each object that is a match. It then writes these to a new variable and calls the visualization functions, passing the new variable, ``filteredData`` as a parameter.

This function is attached to ``onchange`` for each of the filters.

By filtering the data that has already been fetched, the time to redraw the data visualizations is greatly reduced.

#### drawMap()

This function is responsible for rendering the zoomable world map.

It downloads SVG shapes for each continent as well as SVG lines for all of the national borders. It then uses d3 to render these points into a map.

This function is attached to ``window.onload`` so that it runs as soon as the page has finished loading. 


#### plotPoints()

This function is called by ``filter()``. It is responsible for plotting each of the objects onto the map that was created in ``drawMap()``.

It does this by creating SVG circles for each of the objects and placing them at the latitude and longitude stored in the object.

Since the map could have been drawn at any screen size. It uses a d3 function to convert the latitude and longitude to x and y values that are placed in the correct place on the map.

#### drawPie()

This function is called by ``filter()``. It is responsible for creating the pie charts.

It loops through the filtered data for the relevant pieces. (eg. fatal vs non-fatal). It then counts how many of each category exist and feeds that data into d3 to render the SVG pie chart.

#### drawLineGraph()

This function is called by ``filter()``. It is responsible for creating the line graphs.

It loops through the filtered data for the relevant pieces. (eg. Amateur vs commercial flights). It then counts how many of each category exist and feeds that data into d3 to render the SVG pie chart.

### Execution Order

1. getJson()
2. drawMap()
3. Select Option Functions
4. filter()
5. plotPoints()
6. drawPie()
7. drawLineGraph()

### External Libraries
The only external Javascript library in use is d3.js which enables all of the data visualizations on the dashboard.
https://d3js.org/

## License
This project is licensed under the MIT license