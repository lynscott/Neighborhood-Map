// Start View
//Knockout must be used to handle the list, filter, and any other information on
//the page that is subject to changing state. Things that should not be handled
// by Knockout: anything the Maps API is used for, creating markers, tracking
//click events on markers, making the map, refreshing the map. Note 1: Tracking
//click events on list items should be handled with Knockout. Note 2: Creating
//your markers as a part of your ViewModel is allowed (and recommended).
//Creating them as Knockout observables is not.
// Create a new blank array for all the listing markers.

var markers = [];


function markerViewModel() {
    // model info
    var locations = [
      {title: 'City Heights Library', location: {lat: 32.747508, lng: -117.100578}},
      {title: 'Chipotle', location: {lat:  32.749411, lng: -117.099595}},
      {title: 'YMCA', location: {lat: 32.755718, lng: -117.10135 }},
      {title: 'Rock Church', location: {lat:  32.754767, lng: -117.107842}},
      {title: 'SDSU', location: {lat:  32.775722, lng: -117.071889}}
    ];

    return ko.observable(locations);

}



// This function will loop through the markers array and display them all.
function showMarkers() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < googleMarkers().length; i++) {
    var marker = googleMarkers()[i]
    marker.setMap(map);
    bounds.extend(marker.position);
  }

  map.fitBounds(bounds);
};

function hideMarkers() {
  for (var i = 0; i < googleMarkers().length; i++) {
    var marker = googleMarkers()[i]
    marker.setMap(null);
  }
};



// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}



// Style the markers a bit. This will be our listing marker icon.
var defaultIcon = makeMarkerIcon('0091ff');



document.getElementById('zoom-to-area').addEventListener('click', zoomToArea );

// Create a "highlighted location" marker color for when the user
// mouses over the marker.
var highlightedIcon = makeMarkerIcon('FFFF24');

// This function will loop through the listings and hide them all.

//model array


function addLocation(points) {
  this.itemToAdd = ko.observable("user input");
  this.addItem = function() {
      if (this.itemToAdd() != "") {
          this.items.push(this.itemToAdd(points)); // Adds the item. Writing to the "items" observableArray causes any associated UI to update.
          this.itemToAdd("");
        }
      }
    }

function removeLocation(points) {
  this.itemToAdd = ko.observable("user select");
  this.editItem = function() {
      if (this.itemToEdit() != "") {
          this.items.pop(this.itemTo()); // Adds the item. Writing to the "items" observableArray causes any associated UI to update.
          this.itemToAdd("");
        }
      }
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
      if (address == '') {
        window.alert('You must enter an area, or address.');
      } else {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode(
          { address: address,
            componentRestrictions: {locality: 'San Diego'}
          }, function(results, status) {
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


// Make this a ko view

// Two event listeners - one for mouseover, one for mouseout,
// to change the colors back and forth.
// marker.addListener('mouseover', function() {
//   this.setIcon(highlightedIcon);
// });
// marker.addListener('mouseout', function() {
//   this.setIcon(defaultIcon);
// });
function googleMarkers(markers) {
  var googleMarkers = []
  for (var i = 0; i < markers().length; i++) {
    // Get the position from the location array.
    var position = markers()[i].location;
    var title = markers()[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });
    marker.addListener('click', function() {
      populateInfoWindow(this, infoWindow);
    });

    // Push the marker to our array of markers.
    googleMarkers.push(marker);
  }

  return ko.observable(googleMarkers);
}

function viewModel() {
	 var self = this;
   this.query = ko.observable('');
   this.resetMap = function() {
      map.setZoom(13);
      map.setCenter(mapData.center);
    };

   this.markers = new markerViewModel();
   this.googleMarkers = new googleMarkers(this.markers);

   this.markersFilter = ko.dependentObservable(function() {
       var search = self.query().toLowerCase();
       var filter =  ko.utils.arrayFilter(self.googleMarkers(), function(marker) {
          if (marker.title.toLowerCase().indexOf(search) >= 0) {
            return marker;
          }

       }, this);

       return filter;
   });
}

ko.applyBindings(viewModel);

var infoWindow = new google.maps.InfoWindow();

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
       function getStreetView(data, status) {
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
       }
       // Use streetview service to get the closest streetview image within
       // 50 meters of the markers position
       streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
       // Open the infowindow on the correct marker.
       infoWindow.open(map, marker);
     }
    // Make sure the marker property is cleared if the infowindow is closed.
      infoWindow.addListener('closeclick', function() {
      infoWindow.marker = null;
    });

  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  }
  else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      marker.setAnimation(null);
    }, 750);
  }
}



function mapErrorAlert() {
    $('#map').html("<p>An error occoured loading Google Maps. Please try again.</p>");
}
