/*
 * Move to New York application.
 *
 * The app performs these steps:
 *  - Load geo json from server (for main map)
 *  - Accept users general preferences
 *  - Toggle views to input step 2
 *  - Display map and sear field to add any number of places
 *  - Toggle vies to  input step 3 (loading indicator)
 *  - Query mapbox for distances to places given by user
 *  - Calculate score based on these distances
 *  - Hide initial selection page
 *  - Show map with 2 sidebars
 *  - When slider on left sidebar is changed -> update ratings
 *  - When ratings change update the map and the right side bar (ordered results)
 *
 * For all actions please see the code. I tried to add comments to make everything clear.
 */

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

// The maximum amount of places the user can add to his daily route.
// Values under 25 help to make the search fast.
var maxNumberOfUserPlaces = 10;

// The maximum amount of places to query distances at once from mapbox
var maxNumberOfPlacesInDistanceQuery = 100;

// Change 'walking' to cycling of driving if needed
// NOTE: I had to ask the support to activate the distances api for my access token,
//        as it is still in preview. You will have to do the same if you use your account.
var distanceApiUrl = 'https://api.mapbox.com/distances/v1/mapbox/walking?access_token='
                        + L.mapbox.accessToken;

// Our GeoServer data source
var dataSource =  './geoserver/spt-project/ows' +
                  '?service=WFS' +
                  '&version=1.0.0' +
                  '&request=GetFeature' +
                  '&typeName=spt-project:area_ratings' +
                  '&maxFeatures=500' +
                  '&outputFormat=application%2Fjson'; // Output GeoJson for interactive display
// Uncomment for static data
// dataSource = './areas.geojson';

////////////////////////////////////
// Main Program
////////////////////////////////////
var map = initializeMap();

var selection_map = initializeSelectionMap();
var geocoder = L.mapbox.geocoder('mapbox.places');

// Holds the current GeoJSON data displayed on the map
var currentData;
var currentLayer;

// Hold user input values
var centerImportance = 0;
var universityImportance = 0;
var parkingImportance = 0;
var schoolImportance = 0;
var rentalImportance = 0;
var vibrantImportance = 0;
var parkImportance = 0;
var populationImportance = 0;
var complaintImportance = 0;
var playgroundImportance = 0;
var restaurantImportance = 0;
var subwayImportance = 0;
var personalDistanceImportance = 5;

var preferredBoroughs = [];
preferredBoroughs["queens"] = false;
preferredBoroughs["brooklyn"] = false;
preferredBoroughs["manhattan"] = false;
preferredBoroughs["bronx"] = false;
preferredBoroughs["statenIsland"] = false;


// Hold context between html ui elements and map elements
var cardsForFeatures;


// Load our data
$.get(dataSource)
    .done(function (data) {
      currentData = data;
      currentLayer = L.geoJson(currentData, { style: style, onEachFeature: onEachFeature });
      currentLayer.addTo(map);

      // Call it when every data/ratings change to keep the map and ranking list updated
      updateUi();
    })
    .fail(function () {
      alert('Error loading geoJSON file!');
    });

// Init Route Input UI (users important places)
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

// Initiating map for places selection
function initializeSelectionMap() {
  return L.mapbox.map('selection-map', 'mapbox.light')
            .setView(mapViewport.center, mapViewport.initialZoomLevel);
};

// Returns the color of a region based on the given rating value
function getColor(quantil) {
  // A 'relative' rating compared to all values.
  // Use the 'quantil'/percentage position of the element (approximatly).
  // Inverse the value: first element (0) should have the highest rating
  var relativeRating = 1 - quantil;

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

// Returns the style for a region on the map
function style(feature) {
  return {
    fillColor: getColor(feature.quantil),
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

    feature.valuation += centerDistanceValuation(feature);
    feature.valuation += universityValuation(feature);
    feature.valuation += parkingValuation(feature);
    feature.valuation += schoolValuation(feature);
    feature.valuation += rentalValuation(feature);
    feature.valuation += parkingValuation(feature);
    feature.valuation += parkValuation(feature);
    feature.valuation += playgroundValuation(feature);
    feature.valuation += restaurantValuation(feature);
    feature.valuation += subwayValuation(feature);
    feature.valuation += personalDistanceValuation(feature);

    var preferredBoroughsWeight = 3;
    if (preferredBoroughs["queens"] && feature.properties.boro_name == "Queens"
        || preferredBoroughs["brooklyn"] && feature.properties.boro_name == "Brooklyn"
        || preferredBoroughs["manhattan"] && feature.properties.boro_name == "Manhattan"
        || preferredBoroughs["bronx"] && feature.properties.boro_name == "Bronx"
        || preferredBoroughs["statenIsland"] && feature.properties.boro_name == "Staten Island") {
      feature.valuation = (feature.valuation + 1) * preferredBoroughsWeight;
    }
  });

  geoJson.features.sort(function (a, b) {
    return b.valuation - a.valuation;
  });
  for (var i = 0; i < geoJson.features.length; i++) {
    geoJson.features[i].quantil = i / geoJson.features.length;
  }

  return geoJson;
}

// Values a given feature by using an algorithm.
// Returns positive or negative values based on how good this given feature is.
function centerDistanceValuation(feature) {
  // Its better to be close to the center, so value it negative
  return 1 + feature.properties.center_rating * centerImportance * -1 || 0;
}
function universityValuation(feature) {
  return 1 + feature.properties.university_rating * universityImportance || 0;
}
function parkingValuation(feature) {
  return 1 + feature.properties.parking_rating * parkingImportance || 0;
}
function schoolValuation(feature) {
  return 1 + feature.properties.school_rating * schoolImportance || 0;
}
function rentalValuation(feature) {
  return 1 + feature.properties.rental_rating * rentalImportance * - 1 || 0;
}
function parkValuation(feature) {
  return 1 + feature.properties.park_ratings * parkImportance || 0;
}
function playgroundValuation(feature) {
  return 1 + feature.properties.playground_ratings * playgroundImportance || 0;
}
function restaurantValuation(feature) {
  return 1 + feature.properties.restaurant_rating * restaurantImportance || 0;
}
function subwayValuation(feature) {
  return 1 + feature.properties.subway_rating * subwayImportance || 0;
}
function personalDistanceValuation(feature) {
  return 1 + feature.properties.personalDistance * personalDistanceImportance * -1 || 0;
}
// TODO: Add proper valuation functions for different feature aspects


////////////////////////////////////
// UI Code
////////////////////////////////////
$(document).ready(function () {
  initializeSideNavs();
  initializeSliders();
  initializeCheckboxes();

  initializeFinishFirstStepButton();
  initializeFinishSecondStepButton()
});

function initializeFinishFirstStepButton() {
  $('#finish-first-step').click(function () {
    $('#first-step-indicator').toggleClass('completed');
    $('#first-step-indicator').toggleClass('active');
    $('#second-step-indicator').toggleClass('active');
    $('#first-step').hide();
    $('#second-step').show();

    // Needed to correctly load the map
    selection_map.invalidateSize();
  });
}

function initializeFinishSecondStepButton() {
  $('#finish-second-step').click(function () {
    $('#second-step-indicator').toggleClass('completed');
    $('#second-step-indicator').toggleClass('active');
    $('#third-step-indicator').toggleClass('active');
    $('#second-step').hide();
    $('#third-step').show();

    userQuestionDialogFinished();
  });
}

function initializeCheckboxes() {
  $('.ui.checkbox').checkbox();
  $('.ui.radio.checkbox').checkbox();
}

function initializeSliders() {
  $("#personal-distance-slider")
      .slider({ max: 1, min: 0, step: 0.1 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Not Important", "", "", "", "",
                  "", "", "", "", "",
                  "Very Important"]
      })
      .on("slidechange", function(e,ui) {
        personalDistanceImportance = ui.value;
        updateUi();
      });
  $("#central-slider")
      .slider({ max: 1, min: -1, step: 0.2 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Outside", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Central"]
      })
      .on("slidechange", function(e,ui) {
        centerImportance = ui.value;
        updateUi();
      });
  $("#university-slider")
      .slider({ max: 1, min: -1, step: 0.2 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Near", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Far Away"]
      })
      .on("slidechange", function(e,ui) {
        universityImportance = ui.value;
        updateUi();
      });
  $("#parking-slider")
      .slider({ max: 1, min: 0, step: 0.1 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Not Important", "", "", "", "",
                  "", "", "", "", "",
                  "Very Important"]
      })
      .on("slidechange", function(e,ui) {
        parkingImportance = ui.value;
        updateUi();
      });
  $("#school-slider")
      .slider({ max: 1, min: -1, step: 0.2 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Near", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Far Away"]
      })
      .on("slidechange", function(e,ui) {
        schoolImportance = ui.value;
        updateUi();
      });
  $("#rental-slider")
      .slider({ max: 1, min: 0, step: 0.1 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Not Important", "", "", "", "",
                  "", "", "", "", "",
                  "Very Important"]
      })
      .on("slidechange", function(e,ui) {
        rentalImportance = ui.value;
        updateUi();
      });
  $("#vibrant-slider")
      .slider({ max: 1, min: -1, step: 0.2 })
      .slider("pips", {
        step: 5,
        rest: "label",
        labels: ["No", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Yes"]
      })
      .on("slidechange", function(e,ui) {
        vibrantImportance = ui.value;
        updateUi();
      });
  $("#park-slider")
      .slider({ max: 1, min: 0, step: 0.1 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Not Important", "", "", "", "",
                  "", "", "", "", "",
                  "Very Important"]
      })
      .on("slidechange", function(e,ui) {
        parkImportance = ui.value;
        updateUi();
      });
  $("#playground-slider")
      .slider({ max: 1, min: -1, step: 0.2 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Near", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Far Away"]
      })
      .on("slidechange", function(e,ui) {
        playgroundImportance = ui.value;
        updateUi();
      });
  $("#subway-slider")
      .slider({ max: 1, min: 0, step: 0.1 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Not Important", "", "", "", "",
                  "", "", "", "", "",
                  "Very Important"]
      })
      .on("slidechange", function(e,ui) {
        subwayImportance = ui.value;
        updateUi();
      });
  $("#restaurant-slider")
      .slider({ max: 1, min: 0, step: 0.1 })
      .slider("pips", {
        step: 5 ,
        rest: "label",
        labels: ["Not Important", "", "", "", "",
                  "", "", "", "", "",
                  "Very Important"]
      })
      .on("slidechange", function(e,ui) {
        restaurant = ui.value;
        updateUi();
      });
}

function initializeSideNavs() {
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
}

// Called when the user finished the second step of the initial questions.
// Use this to predefine the slider values and to query additional data.
function userQuestionDialogFinished() {
  // Age, under 25 (0), 25-35 (1), 36-50
  var age = $('input[name=age]:checked').val();

  // General Questions
  var hasChildren     = $('#has-children').prop('checked');
  var isStudent       = $('#is-student').prop('checked');
  var hasCar          = $('#has-car').prop('checked');
  var doesSport       = $('#does-sport').prop('checked');
  var usesSubway      = $('#use-subway').prop('checked');
  var likesNature     = $('#likes-nature').prop('checked');

  // Quiet or vibrant, quiet (0), don't care (1), vibrant (2)
  var vibrant = $('input[name=vibrant]:checked').val();

  // Price,
  // low price is very important (0), low price is a little important (1), price is not important at all (2)
  var price = $('input[name=price]:checked').val();

  // Central, outside (0), don't care (1), central (2)
  var central = $('input[name=central]:checked').val();

  // Important Boroughs
  preferredBoroughs["queens"] = $('#borough-queens').prop('checked');
  preferredBoroughs["brooklyn"] = $('#borough-brooklyn').prop('checked');
  preferredBoroughs["manhattan"] = $('#borough-manhattan').prop('checked');
  preferredBoroughs["bronx"] = $('#borough-bronx').prop('checked');
  preferredBoroughs["statenIsland"] = $('#borough-staten-island').prop('checked');

  $('#borough-queens-sidenav').prop('checked', preferredBoroughs["queens"]);
  $('#borough-queens-sidenav').change(function() {
    preferredBoroughs["queens"] = $(this).prop('checked');
    updateUi();
  });
  $('#borough-brooklyn-sidenav').prop('checked', preferredBoroughs["brooklyn"]);
  $('#borough-brooklyn-sidenav').change(function() {
    preferredBoroughs["brooklyn"] = $(this).prop('checked');
    updateUi();
  });
  $('#borough-manhattan-sidenav').prop('checked', preferredBoroughs["manhattan"]);
  $('#borough-manhattan-sidenav').change(function() {
    preferredBoroughs["manhattan"] = $(this).prop('checked');
    updateUi();
  });
  $('#borough-bronx-sidenav').prop('checked', preferredBoroughs["bronx"]);
  $('#borough-bronx-sidenav').change(function() {
    preferredBoroughs["bronx"] = $(this).prop('checked');
    updateUi();
  });
  $('#borough-staten-island-sidenav').prop('checked', preferredBoroughs["statenIsland"]);
  $('#borough-staten-island-sidenav').change(function() {
    preferredBoroughs["statenIsland"] = $(this).prop('checked');
    updateUi();
  });

  // TODO: Pre-Weight sliders


  // Apply our preselection to the data
  updateUi();

  // Filter/Transform selected places to only contain valid coordinate pairs of the selection
  selectedPlaces = selectedPlaces.filter(function(element) {
    return !!element.data;
  });
  selectedPlaces = selectedPlaces.map(function(element) {
    return element.data.geometry.coordinates;
  });

  // Only query the server for distances if the user entered his daily route
  if (selectedPlaces.length > 0) {
    var promise = queryRouteDistance();

    promise.then(function(result) {
      $('#input-view').fadeOut(); // Show the results
    });
  } else {
    $('#input-view').fadeOut(); // Show the results
  }
}

// Queries the rote walking distances for the users daily routes.
// Adds a rating for the resulting distance to every region.
// Returns a promise that resolves when all data is available.
function queryRouteDistance() {
  var regionCenters = currentData.features.map(function(feature) {
    return feature.properties.center.coordinates;
  });

  // Keep track of the maximum distance to normalise the data
  var maxDistance = 1;

  // Keep promises of our requests to be able to fetch the data async
  var promises = [];

  // Wee need to batch request the distances.
  // Mapbox only allows 100 places per request.
  var regionsPerRequest = (maxNumberOfPlacesInDistanceQuery - maxNumberOfUserPlaces);
  for (var i = 0; i < regionCenters.length; i += regionsPerRequest) {

    // We always request in the following format:
    // fixed number of region centers concated with all of the users places.
    // This allows us to read all needed times out of the response.
    var requestData = {
      'coordinates': regionCenters.slice(i, i + regionsPerRequest).concat(selectedPlaces),
    };

    // Calculate all of the distances using mapbox
    var promise = new Promise(function(resolve, reject) {
      var innerI = i;

      $.ajax({
        url: distanceApiUrl,
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        type: 'POST',
        async: true,
        success: function (data, status, xhr) {
          // The Result Data will contain an matrix with distances
          // from each point to each other point.
          var durations = data.durations;

          // First calculate the distances from the first user place to the last user place.
          // This part of the route will always stay the same for each of the regions.
          var fixedRouteDistance = 0;
          for (var j = durations.length - selectedPlaces.length; j < durations.length - 1; j++) {
            fixedRouteDistance += durations[j][j + 1];
          }

          // Now calculate the total distance to each of the centers:
          // center to first place distance + fixedRouteDistance + last place to center distance
          for (var k = 0; k < durations.length - selectedPlaces.length; k++) {
            var centerToFirstPlace = durations[k][durations.length - selectedPlaces.length];
            var lastPlaceToCenter = durations[durations.length - 1][k];

            // Calculate total and save it as a property
            var total = centerToFirstPlace + fixedRouteDistance + lastPlaceToCenter;
            currentData.features[innerI + k].properties.personalDistance = total;

            if (total > maxDistance) {
              maxDistance = total;
            }
          }

          resolve(true);
        },
        error: function(error) {
          reject(error);
        },
      });
    });

    promises.push(promise);
  }

  return Promise.all(promises).then(function(result) {
    // All features now have the personalDistance property calculated.
    // Normalise the data and update the ratings/ui.
    for (var j = 0; j < currentData.features.length; j++) {
      currentData.features[j].properties.personalDistance /= maxDistance;
    }
    updateUi();

    return true;
  });
}

function updateUi() {
  if (currentData) {
    weightGeoJson(currentData);
    updateResultList();
  }

  if (currentLayer) {
    currentLayer.setStyle(style);
  }
}

function updateResultList() {
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

  // The Html used for a single input field to search places
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
      deletePlace(node);
    });

    // Configure The Search function of the Textbox
    node.api({
      mockResponseAsync: queryPlace,
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

  // Used to query a place from the geocoder using the input of the user
  function queryPlace(settings, callback) {
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
  }

  // Deletes a place (out of the ui, the map and the data)
  function deletePlace(node) {
    var index = findIndexOfNode(node);

    if (selectedPlaces[index].marker != null) {
      selection_map.removeLayer(selectedPlaces[index].marker);
    }
    selectedPlaces.splice(index, 1);
    node.remove();
    updateIconIndices();

    $('#add-place').show();
  }

  // Add an click listener to the 'Add Place' Button
  $('#add-place').click(function() {
    addPlace();

    if (selectedPlaces.length >= maxNumberOfUserPlaces) {
      $('#add-place').hide();
    }
  });
}
