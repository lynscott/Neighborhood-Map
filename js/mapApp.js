//Load Google maps api
var locations = [
  { title: 'City Heights Library', location: { lat: 32.747508, lng: -117.100578 } },
  { title: 'Chipotle', location: { lat: 32.749411, lng: -117.099595 } },
  { title: 'YMCA', location: { lat: 32.755718, lng: -117.10135 } },
  { title: 'Rock Church', location: { lat: 32.754767, lng: -117.107842 } },
  { title: 'SDSU', location: { lat: 32.775722, lng: -117.071889 } }
];

function loadScript(src,callback){

var script = document.createElement("script");
script.type = "text/javascript";
if(callback)script.onload=callback;
document.getElementsByTagName("body")[0].appendChild(script);
script.src = src;
}


loadScript('https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=AIzaSyBTZYzfTbP3yeBifwXQZm9VR9p5okWxyP4&v=3&callback=initMap',
          console.log('google-loader has been loaded, but not the maps-API '));


function initMap() {

  console.log('maps-API has been loaded, ready to use');
  var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(32.750873, -117.099478)
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  googleMarkers(locations);

  infoWindow = new google.maps.InfoWindow();
}

var Markers =ko.observableArray();

//VM that interacts with googleMarkers for filtering in the view
function ViewModel() {
  var self = this;
  this.query = ko.observable('');
  this.resetMap = function () {
    map.setZoom(13);
    map.setCenter(mapData.center);
  };

  this.markers = Markers();
  // this.googleMarkers = new googleMarkers(this.markers);

  this.markersFilter = ko.computed(function () {
    var search = self.query().toLowerCase();
    var filter = ko.utils.arrayFilter(this.markers, function (marker) {
      if (marker.title.toLowerCase().indexOf(search) >= 0) {
        return marker;
      }

    }, this);

    return filter;
  });
}

ko.applyBindings(ViewModel);



// This function will loop through the markers array and display them all.
function showMarkers() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < googleMarkers().length; i++) {
    var marker = googleMarkers()[i];
    marker.setMap(map);
    bounds.extend(marker.position);
  }

  map.fitBounds(bounds);
}

//This function will hide all markers on initial list of markers.
function hideMarkers() {
  for (var i = 0; i < googleMarkers().length; i++) {
    var marker = googleMarkers()[i];
    marker.setMap(null);
  }
}



// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
  return markerImage;
}


// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
  // Initialize the geocoder.
  var geocoder = new google.maps.Geocoder();
  // Get the address or place that the user entered.
  var address = document.getElementById('zoom-to-area-text').value;
  // Make sure the address isn't blank.
  if (address === '') {
    window.alert('You must enter an area, or address.');
  } else {
    // Geocode the address/area entered to get the center. Then, center the map
    // on it and zoom in
    geocoder.geocode(
      {
        address: address,
        componentRestrictions: { locality: 'San Diego' }
      }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);
        } else {
          window.alert('We could not find that location - try entering a more' +
            ' specific place.');
        }
      });
  }
}


// This function will create google markers from the initial set of locations
function googleMarkers(markers) {
  var startWindow = function () {
    populateInfoWindow(this, infoWindow);
  };
  // Markers = ko.observableArray();
  for (var i = 0; i < markers.length; i++) {
    // Get the position from the location array.
    var position = markers[i].location;
    var title = markers[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: makeMarkerIcon('0091ff'),
      id: i
    });

    //Populate info window and attach listener to each marker
    marker.addListener('click', startWindow);
    // Push the marker to our array of markers.
    Markers.push(marker);
  }
  
}



//Function for populating the googleMarkers info windows with
//Google streetview services
function populateInfoWindow(marker) {
  console.log(marker.title, 'clicked');
  // Check to make sure the infowindow is not already opened on this marker.
  if (infoWindow.marker != marker) {
    infoWindow.marker = marker;

    infoWindow.setContent('');
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    var getStreetView = function (data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
        infoWindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 20
          }
        };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infoWindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    };
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infoWindow.open(map, marker);
  }
  // Make sure the marker property is cleared if the infowindow is closed.
  infoWindow.addListener('closeclick', function () {
    infoWindow.marker = null;
  });
  //Animate markers with a 750ms bounce
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  }
  else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () {
      marker.setAnimation(null);
    }, 750);
  }
}


//Foursquare api
var client_id = 'KRW4HUBE2V5BW4AFX2DQROVVAMLM3KQBONFFH0SRWBF4X2OX';
var client_secret = 'TK0JPEMFRNDXPCP4JKHWURAQILX2EQUVAEWWXQXCRMXDKE3V';
var base_url = 'https://api.foursquare.com/v2/';
var endpoint = 'venues/search?';

var params = 'near=San+Diego+State+University';
var key = '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=' + '20170101';
var url = base_url + endpoint + params + key;

$.get(url, function (result) {
  //Get string representation of location info
  $('#msg pre').text(JSON.stringify(result));

  var venues = result.response.venues;
  var startSqaureWindow = function () {
    fourSquareInfoWindow(this, infoWindow);
  };

  for (var i in venues) {
    var venue = venues[i];
    // place the a marker on the map
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(venue.location.lat, venue.location.lng),
      map: map,
      animation: google.maps.Animation.DROP,
      title: venue.name,
      marker_id: venue.id,
      address: venue.location.formattedAddress,
      stats: venue.stats.checkinsCount,
      category: venue.categories.name
    });
    marker.addListener('click', startSqaureWindow);
  }
});

//Create info windows for Four Sqaure markers
function fourSquareInfoWindow(marker) {
  console.log(marker.title, 'clicked');
  infoWindow.marker = marker;
  var innerHTML = '<div>';
  if (marker.title) {
    innerHTML += '<strong>' + marker.title + '</strong>';
  }
  if (marker.address) {
    innerHTML += '<br>' + marker.address;
  }
  if (marker.category) {
    innerHTML += '<br>' + 'Category:' + marker.category;
  }
  if (marker.stats) {
    innerHTML += '<br>' + marker.stats + ' Checkins';
  }
  innerHTML += '<br>' + 'Powered by FourSqaure' + '</div>';
  infoWindow.setContent(innerHTML);
  infoWindow.open(map, marker);

}

//Error handling function for google maps
function mapErrorAlert() {
  $('#map').html("<p>An error occoured loading Google Maps. Please try again.</p>");
}
