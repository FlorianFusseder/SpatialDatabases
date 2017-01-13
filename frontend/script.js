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

// Will be computed to find correct colors of sectors
var maxValuation;
var minValuation;

// Hold user input values
var centerImportance = 0;
var universityImportance = 0;
var parkingImportance = 0;
var schoolImportance = 0;
var rentalImportance = 0;
var vibrantImportance = 0;
var parkImportance = 0;
var playgroundImportance = 0;
var restaurantImportance = 0;
var subwayImportance = 0;
var personalDistanceImportance = 0;

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
      if (typeof  data == "string") {
        data = JSON.parse(data);
      }

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

// Returns the style for a region on the map
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

    feature.valuation += personalDistanceValuation(feature);
    feature.valuation += vibrantValuation(feature);
    feature.valuation += centerDistanceValuation(feature);
    feature.valuation += universityValuation(feature);
    feature.valuation += parkingValuation(feature);
    feature.valuation += schoolValuation(feature);
    feature.valuation += rentalValuation(feature);
    feature.valuation += parkingValuation(feature);
    feature.valuation += parkValuation(feature);
    feature.valuation += playareaValuation(feature);
    feature.valuation += subwayValuation(feature);
    feature.valuation += restaurantValuation(feature);
    feature.valuation += complaintValuation(feature);

    // Bonus for preferred regions
    var preferredBoroughsWeight = 3;
    if (preferredBoroughs["queens"] && feature.properties.boro_name == "Queens"
        || preferredBoroughs["brooklyn"] && feature.properties.boro_name == "Brooklyn"
        || preferredBoroughs["manhattan"] && feature.properties.boro_name == "Manhattan"
        || preferredBoroughs["bronx"] && feature.properties.boro_name == "Bronx"
        || preferredBoroughs["statenIsland"] && feature.properties.boro_name == "Staten Island") {

      if (feature.valuation > 0) {
        feature.valuation *= preferredBoroughsWeight;
      } else {
        feature.valuation /= preferredBoroughsWeight;
      }
    }

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
function complaintValuation(feature) {
  var complaintRating = 1 - feature.properties.complaint_rating;

  // Custom weighting -> how important is this rating?
  var weighting = 0.25;

  return complaintRating * weighting || 0;
}

function restaurantValuation(feature) {
  var restaurantRating = feature.properties.restaurant_rating;

  // Custom weighting -> how important is this rating?
  var weighting = 0.5;

  return  restaurantRating * restaurantImportance * weighting || 0;
}

function subwayValuation(feature) {
  // Distance to next subway -> 1 is good, 0 is no subay station
  var subwayRating = feature.properties.subway_rating;

  // No subway station in region, special calculation
  if (subwayRating < 1) {
    subwayRating = (subwayRating * subwayRating * subwayRating) / 3;
  }

  // Custom weighting -> how important is this rating?
  var weighting = 1.5;

  return subwayRating * subwayImportance * weighting || 0;
}

function playareaValuation(feature) {
  var playgroundRating = feature.properties.playground_ratings;
  var soccerRating = feature.properties.soccerfields_rating;

  var playareaRating = (playgroundRating * 3 + soccerRating) / 4;

  // Custom weighting -> how important is this rating?
  var weighting = 1;

  return playareaRating * playgroundImportance * weighting || 0;
}

function parkValuation(feature) {
  var parkRating = feature.properties.park_ratings;

  // Custom weighting -> how important is this rating?
  var weighting = 2;

  if (parkRating > 0.2) {
    parkRating *= 2;
  }
  if (parkRating > 1) {
    parkRating = 1;
  }


  return  parkRating * parkImportance * weighting || 0;
}

function vibrantValuation(feature) {
  var restaurantRating = feature.properties.restaurant_rating;
  var populationRating = feature.properties.population_rating;

  var vibrantRating = (restaurantRating * 2 + populationRating) / 3;

  // Custom weighting -> how important is this rating?
  var weighting = 1;

  return vibrantRating * vibrantImportance * weighting || 0;
}

function rentalValuation(feature) {
  // Invert value -> lowest prices should give positive rating
  var rentalRating = 1 - feature.properties.rental_rating;

  // Custom weighting -> how important is this rating?
  var weighting = 5;

  return rentalRating * rentalImportance * rentalImportance * weighting || 0;
}

function schoolValuation(feature) {
  var schoolRating = feature.properties.school_rating;

  // Custom weighting -> how important is this rating?
  var weighting = 1;

  return schoolRating * schoolImportance * weighting || 0;
}

function parkingValuation(feature) {
  var parkingRating = feature.properties.parking_rating;

  // Custom weighting -> how important is this rating?
  var weighting = 0.6;

  return parkingRating * parkingImportance * weighting|| 0;
}

function universityValuation(feature) {
  var universityRating = feature.properties.university_rating;

  // Custom weighting -> how important is this rating?
  var weighting = 1;

  return  universityRating * universityImportance * weighting|| 0;
}

function centerDistanceValuation(feature) {
  // Distance to location of interest
  // Normalised between 0 and 1
  var centerDistance = feature.properties.center_rating;

  // Inverse value -> 1 is best (closer is better)
  var rating = (1 - centerDistance);

  // Custom weighting -> how important is this rating?
  var weighting = 1;

  return rating * centerImportance * weighting|| 0;
}

function personalDistanceValuation(feature) {
  // Distance to location of interest
  // Normalised between 0 and 1
  var personalDistance = feature.properties.personalDistance;

  // Inverse value -> 1 is best
  var rating = (1 - personalDistance);

  // Custom weighting -> how important is this rating?
  var weighting = 2.5;

  return rating * personalDistanceImportance * weighting || 0;
}


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
        labels: ["Far Away", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Near"]
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
        labels: ["Far Away", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Near"]
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
        labels: ["Far Away", "", "", "", "",
                  "Don't care", "", "", "", "",
                  "Near"]
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
        restaurantImportance = ui.value;
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
  // Age
  var age = $('input[name=age]:checked').val();

  // General Questions
  var hasChildren     = $('#has-children').prop('checked');
  var isStudent       = $('#is-student').prop('checked');
  var hasCar          = $('#has-car').prop('checked');
  var hasDog          = $('#has-dog').prop('checked');
  var doesSport       = $('#does-sport').prop('checked');
  var usesSubway      = $('#use-subway').prop('checked');
  var likesNature     = $('#likes-nature').prop('checked');

  // Quiet or vibrant
  var vibrant = $('input[name=vibrant]:checked').val();

  // Price,
  // low price is very important (0), low price is a little important (1), price is not important at all (2)
  var price = $('input[name=price]:checked').val();

  // Central
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

  // Weight Personal Distance
  personalDistanceImportance = 0.4;
  if (hasCar) {
    personalDistanceImportance -= 0.15;
  }
  if (hasChildren) {
    personalDistanceImportance += 0.15;
  }
  if (!hasCar & !usesSubway) {
    personalDistanceImportance += 0.25;
  }
  if (age == "over50") {
    personalDistanceImportance += 0.1;
  }
  $('#personal-distance-slider').slider('value', personalDistanceImportance);

  // Central
  switch (central) {
    case "away":
      centerImportance = -0.6;
      break;
    case "central":
      centerImportance = 0.6;
      break;
    default:
      centerImportance = 0;
  }
  $('#central-slider').slider('value', centerImportance);

  // University
  universityImportance = 0;
  if (isStudent) {
    if (hasCar) {
      universityImportance += 0.6;
    } else {
      universityImportance += 0.8;
    }
  }
  if (age == "under25" || age == "25to35") {
    universityImportance += 0.1;
  }
  $('#university-slider').slider('value', universityImportance);

  // Parking
  parkingImportance = hasCar ? 0.8 : 0;
  $('#parking-slider').slider('value', parkingImportance);

  // School
  schoolImportance = 0;
  if (hasChildren) {
    schoolImportance += 0.8;
  }
  if (vibrant == "quiet") {
    schoolImportance -= 0.2;
  }
  $('#school-slider').slider('value', schoolImportance);

  // Rental Prices
  switch (price) {
    case "veryCheap":
      rentalImportance = 1;
      break;
    case "cheap":
      rentalImportance = 0.6;
      break;
    default:
      rentalImportance = 0.1;
  }
  $('#rental-slider').slider('value', rentalImportance);

  // Vibrant
  switch (vibrant) {
    case "quiet":
      vibrantImportance = -0.8;
      break;
    case "vibrant":
      vibrantImportance = 0.8;
      break;
    default:
      vibrantImportance = 0;
  }
  $('#vibrant-slider').slider('value', vibrantImportance);

  // Parks
  parkImportance = 0;
  if (hasDog) {
    parkImportance += 0.2;
  }
  if (doesSport) {
    parkImportance += 0.4;
  }
  if (likesNature) {
    parkImportance += 0.6;
  }
  if (hasChildren) {
    parkImportance += 0.2;
  }

  if (parkImportance > 1) {
    parkImportance = 1;
  }

  $('#park-slider').slider('value', parkImportance);

  // PlayAreas
  playgroundImportance = 0;
  if (hasChildren) {
    playgroundImportance = 0.8;
  }
  if (vibrant == "quiet") {
    playgroundImportance -= 0.2;
  }
  $('#playground-slider').slider('value', playgroundImportance);

  // Subway
  subwayImportance = 0;
  if (usesSubway) {
    subwayImportance += 0.6;
  }
  if (!hasCar) {
    subwayImportance += 0.2;
  }
  $('#subway-slider').slider('value', subwayImportance);

  // Restaurants
  restaurantImportance = 0;
  if (vibrant == "vibrant") {
    restaurantImportance += 0.4;
  }
  if (price == "dontCare") {
    restaurantImportance += 0.2;
  } else {
    restaurantImportance -= 0.2;
  }

  if (restaurantImportance < 0){
    restaurantImportance = 0;
  }

  $('#restaurant-slider').slider('value', restaurantImportance);






  // Apply our preselection to the data
  updateUi();

  // Filter/Transform selected places to only contain valid coordinate pairs of the selection
  selectedPlaces = selectedPlaces.filter(function(element) {
    return !!element.data;
  });
  selectedPlaces = selectedPlaces.map(function(element) {
    return element.data.geometry.coordinates;
  });
  selectedPlaces.forEach(function(coordinate, index) {
    var icon = new L.NumberedDivIcon({number: '' + (index + 1)});
    L.marker([coordinate[1], coordinate[0]], {
      icon:	icon,
    }).addTo(map);
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

function initRouteInput() {
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
