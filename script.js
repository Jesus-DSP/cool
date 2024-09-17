// Define the bounding coordinates
const southWest = L.latLng(27.56695, -99.44011);
const northEast = L.latLng(27.57606, -99.42940);
const bounds = L.latLngBounds(southWest, northEast);

// Initialize the map
const map = L.map('map', {
  center: bounds.getCenter(),
  zoom: 16,
  minZoom: 16, // Prevent zooming out beyond zoom level 16
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Initialize variables
let startMarker = null;
let endMarker = null;
let routeLayer = null;

// Detect if the device is touch-enabled
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

// Function to create draggable markers
function createMarker(latlng, label) {
  const marker = L.marker(latlng, { draggable: true }).addTo(map);
  marker.bindPopup(label).openPopup();

  marker.on('dragend', function () {
    if (startMarker && endMarker) {
      getRoute();
    }
  });

  return marker;
}

// Function to fetch and display the route
async function getRoute() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  const apiKey = '5b3ce3597851110001cf6248626d2861289f4f8b9e88658864f9c14f'; // Replace with your OpenRouteService API key
  const url =
    'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

  const coordinates = [
    [startMarker.getLatLng().lng, startMarker.getLatLng().lat],
    [endMarker.getLatLng().lng, endMarker.getLatLng().lat],
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ coordinates }),
    });

    const data = await response.json();

    routeLayer = L.geoJSON(data, {
      style: {
        color: 'blue',
        weight: 4,
      },
    }).addTo(map);
  } catch (error) {
    console.error('Error fetching route:', error);
  }
}

// Function to handle adding markers
function handleMapClick(e) {
  if (!startMarker) {
    startMarker = createMarker(e.latlng, 'Start');
  } else if (!endMarker) {
    endMarker = createMarker(e.latlng, 'End');
    getRoute();
  }
}

// Map click event to add markers using Shift+Click on desktop
map.on('click', function (e) {
  if (e.originalEvent.shiftKey) {
    handleMapClick(e);
  }
});

// Touch events for long press on mobile devices
if (isTouchDevice) {
  let touchStartTime;
  let touchTimeout;
  const longPressDuration = 600; // Duration in milliseconds to consider a long press

  // Touchstart event
  map.on('touchstart', function (e) {
    touchStartTime = Date.now();
    touchTimeout = setTimeout(function () {
      handleMapClick(e);
    }, longPressDuration);
    map.dragging.disable(); // Disable map dragging during long press
  });

  // Touchend event
  map.on('touchend', function (e) {
    // If touch ends before long press duration, cancel the timeout
    if (Date.now() - touchStartTime < longPressDuration) {
      clearTimeout(touchTimeout);
    }
    map.dragging.enable(); // Re-enable map dragging
  });
}

// Reset button functionality
document.getElementById('resetBtn').addEventListener('click', function () {
  if (startMarker) {
    map.removeLayer(startMarker);
    startMarker = null;
  }
  if (endMarker) {
    map.removeLayer(endMarker);
    endMarker = null;
  }
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
});
