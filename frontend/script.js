////////////////////////////////////
// Constants & Configuration
////////////////////////////////////

L.mapbox.accessToken = 'pk.eyJ1IjoiZmxvcmlhbmZyaXR6IiwiYSI6ImNpdzBvOGt4NDAwMnoyc3FjaXU1N2NwMDUifQ.SyyMhFvnlb0Yyy23HKoaMA';

var mapViewport = {
  center: [40.7012965, -73.9857182],
  bounds: [
    [40.356554, -74.4334487], // Southwest coordinates
    [40.983729, -73.5847167],  // Northeast coordinates
  ],
  initialZoomLevel: 10,
  maxZoomLevel: 16,
  minZoomLevel: 10,
};

// Our GeoServer data source
var dataSource =  './geoserver/spt-project/ows' +
                  '?service=WFS' +
                  '&version=1.0.0' +
                  '&request=GetFeature' +
                  '&typeName=spt-project:area_ratings' +
                  '&maxFeatures=500' +
                  '&outputFormat=application%2Fjson'; // Output GeoJson for interactive display
// dataSource = './areas.geojson';

////////////////////////////////////
// Main Programm
////////////////////////////////////
var map = initializeMap();

var selection_map = initializeSelectionMap();
var geocoder = L.mapbox.geocoder('mapbox.places');

// Holds the current GeoJSON data displayed on the map
var currentData;
var currentLayer;
// Will be computed to find correct colors of sectors
var maxValuation;
var minValuation;
// Hold user input values
var areaImportance = 0;
var centerImportance = 0;
var universityImportance = 0;
var parkingImportance = 0;
var schoolImportance = 0;
var rentalImportance = 0;
var populationImportance = 0;
var complaintImportance = 0;
var playgroundImportance = 0;
var parkImportance = 0;
var soccerfieldImportance = 0;
var restaurantImportance = 0;
var subwayImportance = 0;
// Hold context between html ui elements and map elements
var cardsForFeatures;


// Load our data
$.get(dataSource)
    .done(function (data) {
      console.log('Got Data');

      currentData = data;
      currentLayer = L.geoJson(currentData, { style: style, onEachFeature: onEachFeature });
      currentLayer.addTo(map);

      updateUi();
    })
    .fail(function () {
      console.log('Error loading geoJSON file!');
    });

// Init Route Input UI
var selectedPlaces = [];
initRouteInput();


////////////////////////////////////
// Map Setup/Styling
////////////////////////////////////

// Initiating Map with correct viewport
function initializeMap() {
  return L.mapbox.map('map', 'mapbox.light', {
    maxBounds: mapViewport.bounds,
    minZoom: mapViewport.minZoomLevel,
    maxZoom: mapViewport.maxZoomLevel,
  }).setView(mapViewport.center, mapViewport.initialZoomLevel);
};
function initializeSelectionMap() {
  return L.mapbox.map('selection-map', 'mapbox.light')
            .setView(mapViewport.center, mapViewport.initialZoomLevel);
};

function getColor(valuation) {
  var range = maxValuation - minValuation;

  // A 'relative' rating compared to all values.
  // Will be in the range between 0.0 and 1.0
  var relativeRating = (valuation - minValuation) / (range * 1.0);

  if (relativeRating > 0.8) return '#54d83a';
  if (relativeRating > 0.7) return '#86d83a';
  if (relativeRating > 0.6) return '#a9d83a';
  if (relativeRating > 0.5) return '#cbd83a';
  if (relativeRating > 0.4) return '#d8c33a';
  if (relativeRating > 0.3) return '#d89c3a';
  if (relativeRating > 0.2) return '#d87c3a';
  if (relativeRating > 0.1) return '#d85f3a';
                            return '#d83a3a';
}

function style(feature) {
  return {
    fillColor: getColor(feature.valuation),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7,
  };
}

////////////////////////////////////
// Data Processing
////////////////////////////////////

// Applies the user selected ratings to the given geo json.
// Will add an additional 'valuation' property to each feature.
function weightGeoJson(geoJson) {
  geoJson.features.forEach(function (feature) {
    feature.valuation = 0;

    feature.valuation += areaValuation(feature);
    feature.valuation += centerDistanceValuation(feature);
    feature.valuation += universityValuation(feature);
    feature.valuation += parkingValuation(feature);
    feature.valuation += schoolValuation(feature);
    feature.valuation += rentalValuation(feature);
    feature.valuation += populationValuation(feature);
    feature.valuation += complaintValuation(feature);
    feature.valuation += parkingValuation(feature);
    feature.valuation += parkValuation(feature);
    feature.valuation += playgroundValuation(feature);
    feature.valuation += restaurantValuation(feature);
    feature.valuation += soccerfieldsValuation(feature);
    feature.valuation += subwayValuation(feature);

    // Keep minimum and maximum, useful to get good colors for the map
    if (feature.valuation > maxValuation) {
      maxValuation = feature.valuation;
    }
    if (feature.valuation < minValuation) {
      minValuation = feature.valuation;
    }
  });

  geoJson.features.sort(function (a, b) {
    return b.valuation - a.valuation;
  });
  maxValuation = geoJson.features[0].valuation;
  minValuation = geoJson.features[geoJson.features.length - 1].valuation;

  return geoJson;
}

// Values a given feature by using an algorithm.
// Returns positive or negative values based on how good this given feature is.
function areaValuation(feature) {
  return feature.properties.size_rating * areaImportance || 0;
}
function centerDistanceValuation(feature) {
  // Its better to be close to the center, so value it negative
  return feature.properties.center_rating * centerImportance * -1 || 0;
}
function universityValuation(feature) {
  return feature.properties.university_rating * universityImportance || 0;
}
function parkingValuation(feature) {
  return feature.properties.parking_rating * parkingImportance || 0;
}
function schoolValuation(feature) {
  return feature.properties.school_rating * schoolImportance || 0;
}
function rentalValuation(feature) {
  return feature.properties.rental_rating * rentalImportance || 0;
}
function populationValuation(feature) {
  return feature.properties.population_rating * populationImportance || 0;
}
function complaintValuation(feature) {
  return feature.properties.complaint_rating * complaintImportance || 0;
}
function parkValuation(feature) {
  return feature.properties.park_ratings * parkImportance || 0;
}
function playgroundValuation(feature) {
  return feature.properties.playground_ratings * playgroundImportance || 0;
}
function restaurantValuation(feature) {
  return feature.properties.restaurant_rating * restaurantImportance || 0;
}
function soccerfieldsValuation(feature) {
  return feature.properties.soccerfields_rating * soccerfieldImportance || 0;
}
function subwayValuation(feature) {
  return feature.properties.subway_rating * subwayImportance || 0;
}

// TODO: Add proper valuation functions for different feature aspects


////////////////////////////////////
// UI Code
////////////////////////////////////
$(document).ready(function () {
  $('#toggle-left-nav').click(function () {
    var $leftNav = $('#left-nav');

    if ($leftNav.css('margin-left').replace('px', '') < 0) {
      $leftNav.animate({'margin-left': 0}, {step: animationStep});
    } else {
      $leftNav.animate({'margin-left': -271}, {step: animationStep});
    }
  });

  $('#toggle-right-nav').click(function () {
    var $rightNav = $('#right-nav');

    if ($rightNav.css('margin-right').replace('px', '') < 0) {
      $rightNav.animate({'margin-right': 0}, {step: animationStep});
    } else {
      $rightNav.animate({'margin-right': -271}, {step: animationStep});
    }
  });

  // Sliders
  $('#area-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { areaImportance = val; updateUi(); },
  });
  $('#center-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { centerImportance = val; updateUi(); },
  });
  $('#university-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { universityImportance = val; updateUi(); },
  });
  $('#parking-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { parkingImportance = val; updateUi(); },
  });
  $('#school-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { schoolImportance = val; updateUi(); },
  });
  $('#rental-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { rentalImportance = val; updateUi(); },
  });
  $('#population-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { populationImportance = val; updateUi(); },
  });
  $('#complaint-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { complaintImportance = val; updateUi(); },
  });
  $('#playground-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { playgroundImportance = val; updateUi(); },
  });
  $('#park-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { parkImportance = val; updateUi(); },
  });
  $('#soccerfield-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { soccerfieldImportance = val; updateUi(); },
  });
  $('#restaurant-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { restaurantImportance = val; updateUi(); },
  });
  $('#subway-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { subwayImportance = val; updateUi(); },
  });


  $('.ui.checkbox').checkbox();

  $('#finish-first-step').click(function () {
    $('#first-step-indicator').toggleClass('completed');
    $('#first-step-indicator').toggleClass('active');
    $('#second-step-indicator').toggleClass('active');
    $('#first-step').hide();
    $('#second-step').show();

    // Needed to correctly load the map
    selection_map.invalidateSize();
  });

  $('#finish-second-step').click(function () {
    $('#second-step-indicator').toggleClass('completed');
    $('#second-step-indicator').toggleClass('active');
    $('#third-step-indicator').toggleClass('active');
    $('#second-step').hide();
    $('#third-step').show();

    // TODO: Pre set the weighting sliders
    // TODO: query for points that the user is interested in

    if ($('#has-children').prop('checked') == true) {
      $('#area-range').range('set value', 1);
    } else {
      $('#area-range').range('set value', -1);
    }

    setTimeout(function () {
      $('#input-view').fadeOut();
    }, 2000);
  });
});

function updateUi() {
  $('#are-range-label').html('Area (' + areaImportance + ')');
  $('#center-range-label').html('Center (' + centerImportance + ')');
  $('#university-range-label').html('University (' + universityImportance + ')');
  $('#parking-range-label').html('Parking (' + parkingImportance + ')');
  $('#school-range-label').html('School (' + schoolImportance + ')');
  $('#rental-range-label').html('Rental (' + rentalImportance + ')');
  $('#population-range-label').html('Population (' + populationImportance + ')');
  $('#complaint-range-label').html('Complaint (' + complaintImportance + ')');
  $('#playground-range-label').html('Playground (' + playgroundImportance + ')');
  $('#park-range-label').html('Park (' + parkImportance + ')');
  $('#soccerfield-range-label').html('Soccerfield (' + soccerfieldImportance + ')');
  $('#restaurant-range-label').html('Restaurant (' + restaurantImportance + ')');
  $('#subway-range-label').html('Subway (' + subwayImportance + ')');

  if (currentData) {
    weightGeoJson(currentData);

    $('#result-list').html('');
    cardsForFeatures = {};

    currentData.features.forEach(function (feature) {
      var nodeHtml =  '<a class="ui card" id="feature-card-' + feature.id + '">' +
                        '<div class ="content">' +
                          '<div class="header">' + feature.properties.ntaname + '</div>' +
                          '<div class="meta">' + feature.properties.boro_name + '</div>' +
                        '</div>' +
                      '</a>';

      var node = $(nodeHtml).hover(
          function () {
            highlightFeature(feature);
          },
          function () {
            resetHighlight(feature);
          }
      ).click(
          function () {
            zoomToFeature(feature);
          }
      );
      node.appendTo($('#result-list'));

      cardsForFeatures[feature.id] = node;
    });
  }

  if (currentLayer) {
    currentLayer.setStyle(style);
  }
}

function animationStep(now, tween) {
  map.invalidateSize();
}

// Highlight functions
function highlightFeature(feature) {
  var layer = findLayer(feature);

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7,
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  cardsForFeatures[feature.id].css('background-color', '#DCDCDC');
}

function resetHighlight(feature) {
  var layer = findLayer(feature);

  currentLayer.resetStyle(layer);

  cardsForFeatures[feature.id].css('background-color', 'white');
}

function zoomToFeature(feature) {
  var layer = findLayer(feature);

  map.flyToBounds(layer.getBounds(), { padding: [150, 150] });

  if (cardsForFeatures[feature.id].offset().top < 0 ||
      cardsForFeatures[feature.id].offset().top > $('#right-nav-content').height()) {
    $('#right-nav-content').animate({
      scrollTop: $('#right-nav-content').scrollTop() + cardsForFeatures[feature.id].offset().top - 8,
    }, 400);
  }
}

function findLayer(feature) {
  for (var key in currentLayer._layers) {
    if (currentLayer._layers[key].feature.id == feature.id)
      return currentLayer._layers[key];
  }

  return null;
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: function (event) { highlightFeature(feature); },
    mouseout: function (event) { resetHighlight(feature); },
    click: function (event) { zoomToFeature(feature); },
  });
}


////////////////////////////////////
// Second Question Pane - Users Important Places
////////////////////////////////////
function initRouteInput() {
  // Source: https://gist.github.com/comp615/2288108
  // Displays a marker with a number in it
  L.NumberedDivIcon = L.Icon.extend({
    options: {
      iconUrl: 'http://www.charliecroom.com/marker_hole.png',
      number: '',
      shadowUrl: null,
      iconSize: new L.Point(25, 41),
      iconAnchor: new L.Point(13, 41),
      popupAnchor: new L.Point(0, -33),
      /*
       iconAnchor: (Point)
       popupAnchor: (Point)
       */
      className: 'leaflet-div-icon'
    },

    createIcon: function () {
      var div = document.createElement('div');
      var img = this._createImg(this.options['iconUrl']);
      var numdiv = document.createElement('div');
      numdiv.setAttribute ( "class", "number" );
      numdiv.innerHTML = this.options['number'] || '';
      div.appendChild ( img );
      div.appendChild ( numdiv );
      this._setIconStyles(div, 'icon');
      return div;
    },

    //you could change this to add a shadow like in the normal marker if you really wanted
    createShadow: function () {
      return null;
    }
  });

  // The Html used for a single input field to seach places
  var nodeHtml =
      '<div class="two fields">' +
        '<div class="field">' +
          '<div class="ui search">' +
            '<div class="ui icon input">' +
              '<input class="prompt" type="text" placeholder="Address">' +
              '<i class="search icon"></i>' +
            '</div>' +
            '<div class="results"></div>' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<button class="ui negative button">Remove</button>' +
        '</div>' +
      '</div> ';
  var $route_inputs = $('#route-inputs');

  // Called when the user adds a new place.
  // Adds a new input node an configures its events.
  function addPlace() {
    var node = $(nodeHtml);

    // Allow Removal of Places
    // Be sure to update the data, ui and the markers on teh map
    node.find('.ui.negative.button').click(function() {
      var index = findIndexOfNode(node);

      if (selectedPlaces[index].marker != null) {
        selection_map.removeLayer(selectedPlaces[index].marker);
      }
      selectedPlaces.splice(index, 1);
      node.remove();
      updateIconIndices();
    });

    // Configure The Search function of the textbox
    node.api({
      mockResponseAsync: function(settings, callback) {
        const query = settings.urlData.query;

        if (query) {
          var queryOptions = {
            query: query,
            proximity: mapViewport.center,
          };
          geocoder.query(queryOptions, function(error, data) {
            if (error) {
              callback([]);
            } else {
              callback(data.results);
            }
          });
        } else {
          callback([]);
        }
      },
    }).search({
      fields: {
        results: 'features',
        title: 'place_name',
      },
      onSelect: function(result, response) {
        var index = findIndexOfNode(node);

        var targetPosition = result.geometry.coordinates;
        selectedPlaces[index].data = result;
        if (selectedPlaces[index].marker) {
          selectedPlaces[index].marker.setLatLng([targetPosition[1], targetPosition[0]]);
        } else {
          selectedPlaces[index].marker =
              L.marker([targetPosition[1], targetPosition[0]], {
                icon:	new L.NumberedDivIcon({number: '' + (index + 1)}),
              }).addTo(selection_map);
        }
      },
    });

    // Add our new search box to the ui
    node.appendTo($route_inputs);

    // Insert our new place to the data array
    selectedPlaces.push({ node: node, data: null, marker: null });
  }

  // Updates the numbers displayed in the Markers on the map.
  // Needed when deleting Places, as this changes the order/array.
  function updateIconIndices() {
    for(var index = 0; index < selectedPlaces.length; index++) {
      if (selectedPlaces[index].marker != null) {
        selectedPlaces[index].marker.setIcon(new L.NumberedDivIcon({number: '' + (index + 1)}));
      }
    }
  }

  // Search for the position of a node in the 'selectedPlaces'.
  // This is needed as the array changes indices when removing places.
  function findIndexOfNode(node) {
    var index;

    selectedPlaces.forEach(function(element, position) {
      if (element.node == node) {
        index = position;
      }
    });

    return index;
  }

  // Add an click listener to the 'Add Place' Button
  $('#add-place').click(function() {
    addPlace();
  });

}
