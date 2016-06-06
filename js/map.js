
'use strict';

/**
 * Model Class
 *
 * @class
 */
var model = {
  // Constants
  DEVID: 1000770,
  SECKEY: 'ffda6266-2156-11e6-a0ce-06f54b901f07',
  BASE_URL: 'http://timetableapi.ptv.vic.gov.au',
  MAX_TT_ENTRIES: 1,
  DEFAULT_LOCATION: {lat: -37.814, lng: 144.963}, // Melbourne CBD by default
  // Variables
  map: {},
  geocoder: {},
  centerMarker: {},
  PTVLocations: [],
  PTVLocationMarkers: [],
  selectedPTVLocations: [],
  centerAddress: {}
};

/**
 * Octopus (Controller) Class
 *
 * @class
 */
var octopus = {
  /**
   * Octopus initialisation function
   */
  init: function() {
    viewModel.init();
    $(window).resize( function() {
      viewModel.setMapViewSize();
      var center = model.map.getCenter();
      google.maps.event.trigger(model.map, 'resize');
      model.map.setCenter(center);
    });
  },
  /**
   * PTV API health check call
   */
  PTVHealthCheck: function() {
    // Build URL
    var now = new Date();
    var time_url = now.toISOString();
    var var_url = '/v2/healthcheck?timestamp=' + time_url + '&devid=' + model.DEVID;
    // Calculate signature
    var hash = CryptoJS.HmacSHA1(var_url, model.SECKEY);
    // Full URL
    var url_all = model.BASE_URL + var_url + '&signature=' + hash.toString();
    // PTV API call
    $.getJSON(url_all, function(data) {
      console.log(data);
    });
  },
  /**
   * Set center of map at new provided address
   */
  setNewCenterAddress: function(address) {
    model.geocoder.geocode( {'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        // Set new center in map
        model.map.setCenter(results[0].geometry.location);
        // Update center Marker
        octopus.setCenterMarker(results[0].geometry.location);
      } else {
        console.log('Geocode unsuccessful:', status);
      }
      viewModel.resetAddressInput();
    });
  },
  /**
   * Show "You're here" marker at provided location
   */
  setCenterMarker: function(coord) {
    // First, remove any previous center marker
    if (model.centerMarker.setMap) {
      model.centerMarker.setMap(null);
    };
    // Add center marker around provided center coordinates
    model.centerMarker = new google.maps.Marker({
      map: model.map,
      position: coord,
      title: 'You are here',
      icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
    });
  },
  /**
   * Update Stop List visible in map
   */
  updateStopList: function() {
    var showLocation;
    viewModel.stopList.removeAll();
    if (model.PTVLocations) {
      model.selectedPTVLocations = []; // Start with empty list
      model.PTVLocations.forEach( function(location, index, arr) {
        showLocation = false; // by default
        if (viewModel.query() != '') {
          if (location.result.location_name.toLowerCase().indexOf(viewModel.query().toLowerCase()) >= 0) {
            showLocation = true;
          };
        } else {
          showLocation = true
        };
        if(showLocation && model.map.getBounds().contains(model.PTVLocationMarkers[index].getPosition())) {
           viewModel.stopList.push(location);
           model.selectedPTVLocations.push(index);
        };
      });
    }
  },
  /**
   * Initial map setup, setting center with geolocation and adding markers
   * for PTV locations.
   */
  initMap: function() {
    // Get current location to center inital map
    var pos;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( function(position) {
        pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

      }, function() {
        // Geolocation not supported, or permsission not provided
        alert("We could not locate where you are; please use the address input instead");
      });
    } else {
      // Geolocation not supported
      alert("We could not locate where you are; please use the address input instead");
    }
    viewModel.setMapViewSize();
    // Initialise map
    model.geocoder = new google.maps.Geocoder();
    if (!pos) {
      pos = model.DEFAULT_LOCATION;
    }
    model.map = new google.maps.Map(document.getElementById('map'), {center: pos, zoom: 17});

    model.map.addListener('idle', function() {
      // Add Markers for PTV locations around center
      octopus.addPTVLocationMarkers({lat: model.map.getCenter().lat(), lng: model.map.getCenter().lng()});
    });
},
  /**
   * Display Timetable for a specific location in an infoWindow
   */
  renderLocationTimetable: function (location, marker) {
    var iwContent;
    // Location type
    var stop_type;
    var time_service;
    var blineNumber = false;
    var infoWindow = new google.maps.InfoWindow();

    switch (location.result.route_type) {
      case 0: // Train
        stop_type = 'Metro Train';
        break;
      case 1: // Tram
        stop_type = 'Tram';
        blineNumber = true;
        break;
      case 2: // Metro Bus
        stop_type = 'Metro Bus';
        blineNumber = true;
        break;
      case 3: // v/Line Train & Coach => DO NOT SHOW!
        stop_type = 'vLine';
        blineNumber = true;
        break;
      case 4: // night bus
        stop_type = 'Nightrider';
        blineNumber = true;
        break;
      default:
        stop_type = 'Unknown';
    }
    iwContent = '<p><b>' + stop_type + ' Stop </b><br>(' + location.result.location_name + ')</p>';
    // Build Location Timetable API requestt:
    var var_url = '/v2/mode/' + location.result.route_type +
                  '/stop/' + location.result.stop_id +
                  '/departures/by-destination/limit/' + model.MAX_TT_ENTRIES + '?devid=' + model.DEVID;
    // -> Calculate signature
    var hash = CryptoJS.HmacSHA1( var_url, model.SECKEY);
    // -> Full URL
    var url_all = model.BASE_URL + var_url + '&signature=' + hash.toString();
    // PTV API request
    $.getJSON(url_all, function(data) {
      iwContent += '<table><thead><tr><th>To:</th><th>Time:</th></thead>';
      data.values.forEach( function(rec, index, arr) {
        iwContent += '<tr><td>';
        if (blineNumber) {
          iwContent += rec.platform.direction.line.line_number + ' - ';
        }
        time_service = new Date(rec.time_timetable_utc);
        iwContent += rec.platform.direction.direction_name + '</td><td>' + time_service.toTimeString().slice(0,8) + '</td></tr>';
      });
      iwContent += '</table>';
      infoWindow.setOptions({
        content: iwContent,
        disableAutoPan: true
      });
      infoWindow.open(model.map, marker);
    });
  },
  /**
   * Display Timeetable in a location, provided the id in the list of stops
   */
  renderLocationTimetableByIndex: function(id) {
    if(id <= model.selectedPTVLocations.length) {
      var locationIdx = model.selectedPTVLocations[id];
      octopus.renderLocationTimetable(model.PTVLocations[locationIdx], model.PTVLocationMarkers[locationIdx]);
    }
  },
  /**
   * Add markers for PTV location markers around current location or provided address
   */
  addPTVLocationMarkers: function(coord) {
     // First, remove any previous PTV location markers
     if (model.PTVLocationMarkers) {
       model.PTVLocationMarkers.forEach( function(locationMarker, index, arr) {
         locationMarker.setMap(null);
       });
     };
     model.PTVLocations = [];
     model.PTVLocationMarkers = [];
     // Add PTV markers around provided center coordinates:
     // -> Build PTV API URL
     var var_url = '/v2/nearme/latitude/' + coord.lat + '/longitude/' + coord.lng + '?devid=' + model.DEVID;
     // -> Calculate signature
     var hash = CryptoJS.HmacSHA1( var_url, model.SECKEY);
     // -> Full URL
     var url_all = model.BASE_URL + var_url + '&signature=' + hash.toString();
     // PTV API request
     $.getJSON(url_all, function(data) {
       // Iterate over all locations returned and add them to map (only if their
       // coordinates are visible
       var showLocation;
       var icon_img;
       var infoWindow;
       var marker;
       $.each(data, function(index, location) {
         showLocation = true;
         switch (location.result.route_type) {
           case 0: // Train
             icon_img = 'img/iconTrain.png';
             break;
           case 1: // Tram
             icon_img = 'img/iconTram.png';
             break;
           case 2: // Metro Bus
             icon_img = 'img/iconBus.png';
             break;
           case 3: // v/Line Train & Coach => DO NOT SHOW!
             showLocation = false;
             break;
           case 4: // night bus
             icon_img = 'img/iconNightRider.png';
             break;
           default:
             icon_img = 'img/questionMark.png';
         }
         if (showLocation) {
           marker = new google.maps.Marker({
             map: model.map,
             position: {lat: location.result.lat, lng: location.result.lon},
             title: location.result.location_name,
             icon: icon_img
           });
           model.PTVLocations.push(location);
           model.PTVLocationMarkers.push(marker);
           marker.addListener('click', (function(mk, loc) {
             return function() {
               octopus.renderLocationTimetable(loc, mk);
             };
           })(marker, location));
         };
       });
       // Finally, update Stop List in side view
       octopus.updateStopList();
     })
     .fail(function() {
       console.log('Error in API call');
       alert('Error with PTV API; please, check your internet connection');
     });
   }
};

/**
 * viewModel Class
 *
 * @class
 */
var viewModel = {
  /**
   * viewModel initialisation
   */
  init: function() {

    $('.showSideView').click( function() {
      $('.side-view').addClass('active');
      $('#page').addClass('active');
    });

    $('.hideSideView').click( function() {
      $('.side-view').removeClass('active');
      $('#page').removeClass('active');
    });

    $('#address-input').keypress( function(e) {
      if (e.which == 13) { //enter key
        $('#form-location').submit();
        return false;
      }
    });

    $('#stopListModal').on('hidden.bs.modal', function(e) {
      viewModel.resetStopList();
    });

    $('#close-modal').click( function() {

    });

    $('.close').click( function() {
      viewModel.resetAddressInput();
    });
    viewModel.query.subscribe(viewModel.updateStopList);
  },
  /**
   * Mofify map dimensions, according to window sizing
   */
  setMapViewSize: function() {
    $('#map-view').height($(window).height() - $('#header-row').height());
    $('#map-view').width($('#table-container').width());
  },
  /**
   * Get address input and move map center
   */
  updateCenter: function() {
    var newAddress = $('#address-input').val();
    octopus.setNewCenterAddress(newAddress);
  },
  query: ko.observable(''),
  stopList: ko.observableArray(),
  /**
   * Update stop list to be shown (with changes in query and visibility)
   */
  updateStopList: function() {
    octopus.updateStopList();
  },
  /**
   * Set blan query to show all visible stops
   */
  resetStopList: function() {
    $('#stop-search').val('');
    viewModel.query('');
    octopus.updateStopList();
  },
  /*
   * Called when stop selected from list
   */
  selectStop: function(index) {
    octopus.renderLocationTimetableByIndex(index);
    $('#close-modal').trigger('click');
},
  /**
   * Set address input filed to blank
   */
  resetAddressInput: function() {
    $('#address-input').val('');
  }
}

ko.applyBindings(viewModel);

//PTVHealthCheck();

// Init app
octopus.init();

// Callback function for Google Maps API
function initMap() {
  octopus.initMap();
};
