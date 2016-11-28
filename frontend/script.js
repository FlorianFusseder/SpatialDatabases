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
                  '&typeName=spt-project:areas' +
                  '&maxFeatures=500' +
                  '&outputFormat=application%2Fjson'; // Output GeoJson for interactive display
// dataSource = './areas.geojson';

////////////////////////////////////
// Main Programm
////////////////////////////////////
var map = initializeMap();

// Holds the current GeoJSON data displayed on the map
var currentData;
var currentLayer;
// Will be computed to find correct colors of sectors
var maxValuation;
var minValuation;
// Hold user input values
var areaImportance = 0;
var lengthImportance = 0;


// Load our data
$.get(dataSource)
    .done(function (data) {
      currentData = data;
      currentLayer = L.geoJson(currentData, { style: style });
      currentLayer.addTo(map);

      updateUi();
    })
    .fail(function () {
      console.log('Error loading geoJSON file!');
    });


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
    feature.valuation += lengthValuation(feature);
    // TODO: Add proper valuation functions for different feature aspects

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
  return feature.properties.shape_area * areaImportance;
}
function lengthValuation(feature) {
  return feature.properties.shape_leng * lengthImportance;
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

  $('#area-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { areaImportance = val; updateUi(); },
  });
  $('#length-range').range({
    min: -5,
    max: 5,
    start: 0,
    step: 1,
    onChange: function (val) { lengthImportance = val; updateUi(); },
  });
});

function updateUi() {
  $('#are-range-label').html('Area (' + areaImportance + ')');
  $('#length-range-label').html('Length (' + lengthImportance + ')');

  if (currentData) {
    weightGeoJson(currentData);

    var resultHtml = '';
    currentData.features.forEach(function (feature) {
      resultHtml += '<div class="card">' +
                      '<div class ="content">' +
                        '<div class="header">' + feature.properties.ntaname + '</div>' +
                        '<div class="meta">' + feature.properties.boro_name + '</div>' +
                      '</div>' +
                    '</div>';
    });

    $('#result-list').html(resultHtml);
  }

  if (currentLayer) {
    currentLayer.setStyle(style);
  }
}

function animationStep(now, tween) {
  map.invalidateSize();
}
