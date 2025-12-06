// --- Global Variables ---
let map;
let userMarker;
let randomMarker;
const MAX_DISTANCE_KM = 2; // Set your max distance (2 kilometers)

// --- Map Initialization Function ---
function initializeMap(lat, lng) {
    const defaultZoom = 15;
    
    // 1. Initialize the Leaflet map on the 'map' div
    if (!map) {
        map = L.map('map').setView([lat, lng], defaultZoom);

        // Add the OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add a marker for the user's location
        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('You Are Here!').openPopup();
    } else {
        // If map already exists, just update the view
        map.setView([lat, lng], defaultZoom);
        userMarker.setLatLng([lat, lng]);
    }
}

// --- Random Point Generation Function (The Core Logic) ---
// Generates a random coordinate within a given radius (km) of the center point.
function generateRandomPoint(centerLat, centerLng, radius) {
    const radiusInDegrees = radius / 111.32; // Approx. conversion of km to degrees near the equator

    // Pick a random distance 'r' and a random angle 't'
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    // Calculate the new coordinates
    const newLat = centerLat + y;
    // Account for longitude changing with latitude (approximate)
    const newLng = centerLng + x / Math.cos(centerLat * Math.PI / 180);

    return { lat: newLat, lng: newLng };
}


// --- Main Action Function ---
function findRandomSpot() {
    document.getElementById('status-message').textContent = "Finding your current location...";
    
    // Check if the browser supports the Geolocation API
    if (!navigator.geolocation) {
        document.getElementById('status-message').textContent = "Geolocation is not supported by your browser.";
        return;
    }

    // Request the user's current position
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            document.getElementById('status-message').textContent = `Location found. Generating random spot within ${MAX_DISTANCE_KM}km...`;
            
            // Initialize or update the map with the user's location
            initializeMap(userLat, userLng);
            
            // Generate the random point
            const randomSpot = generateRandomPoint(userLat, userLng, MAX_DISTANCE_KM);
            
            // Remove previous random marker if it exists
            if (randomMarker) {
                map.removeLayer(randomMarker);
            }
            
            // Add a new marker for the random spot
            randomMarker = L.marker([randomSpot.lat, randomSpot.lng], {
                icon: L.divIcon({className: 'custom-div-icon', html: '🌟', iconSize: [30, 42], iconAnchor: [15, 42]})
            }).addTo(map)
            .bindPopup('Your Destination!').openPopup();

            // Fit the map view to show both markers
            const bounds = L.latLngBounds(userMarker.getLatLng(), randomMarker.getLatLng());
            map.fitBounds(bounds, { padding: [50, 50] });

            document.getElementById('status-message').innerHTML = `**Go here:** Lat: ${randomSpot.lat.toFixed(4)}, Lng: ${randomSpot.lng.toFixed(4)}`;
        },
        (error) => {
            // Handle errors (e.g., user denied location, timeout)
            let errorMessage = "Error getting location. ";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "Please grant location access in your browser settings.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "The request to get user location timed out.";
                    break;
                default:
                    errorMessage += "An unknown error occurred.";
            }
            document.getElementById('status-message').textContent = errorMessage;
        }
    );
}

// --- Event Listener ---
document.getElementById('findSpotBtn').addEventListener('click', findRandomSpot);

// Initial setup to encourage the user
document.addEventListener('DOMContentLoaded', () => {
    // This is optional, but gives a better mobile experience by setting the map size immediately
    document.getElementById('map').style.height = '400px'; 
    // And pre-load a default map view (e.g., a generic city like London) if location permission is slow
    // initializeMap(51.505, -0.09); 
});
