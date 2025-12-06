// --- Global Variables ---
let map;
let userMarker;
let randomMarker;
let routeLine; // New variable to hold the line connecting the two points
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
function generateRandomPoint(centerLat, centerLng, radius) {
    const radiusInDegrees = radius / 111.32; // Approx. conversion of km to degrees near the equator

    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    const newLat = centerLat + y;
    const newLng = centerLng + x / Math.cos(centerLat * Math.PI / 180);

    return { lat: newLat, lng: newLng };
}


// --- Main Action Function ---
function findRandomSpot() {
    document.getElementById('status-message').textContent = "Finding your current location...";
    
    if (!navigator.geolocation) {
        document.getElementById('status-message').textContent = "Geolocation is not supported by your browser.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const userLatLng = [userLat, userLng]; // Array for polyline

            document.getElementById('status-message').textContent = `Location found. Generating random spot within ${MAX_DISTANCE_KM}km...`;
            
            initializeMap(userLat, userLng);
            
            const randomSpot = generateRandomPoint(userLat, userLng, MAX_DISTANCE_KM);
            const randomLatLng = [randomSpot.lat, randomSpot.lng]; // Array for polyline

            // --- 1. Update/Add Random Marker ---
            if (randomMarker) {
                map.removeLayer(randomMarker);
            }
            
            // Add a new standard marker for the random spot
            randomMarker = L.marker(randomLatLng).addTo(map) // Removed old custom icon
            .bindPopup('Your Destination!').openPopup();


            // --- 2. Draw the Route Line (Polyline) ---
            if (routeLine) {
                map.removeLayer(routeLine);
            }
            
            // Define the coordinates for the line: from user to random spot
            const latlngs = [userLatLng, randomLatLng];
            
            // Create and add the blue, dashed line to the map
            routeLine = L.polyline(latlngs, {
                color: 'blue',
                weight: 5,
                opacity: 0.7,
                dashArray: '10, 10' // Makes the line dashed
            }).addTo(map);


            // Fit the map view to show both markers and the line
            const bounds = L.latLngBounds(userLatLng, randomLatLng);
            map.fitBounds(bounds, { padding: [50, 50] });

            document.getElementById('status-message').innerHTML = `**Go here:** Lat: ${randomSpot.lat.toFixed(4)}, Lng: ${randomSpot.lng.toFixed(4)}`;
        },
        (error) => {
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

// --- Initial map setup (Fixes the blank map box) ---
const defaultLat = 51.505; 
const defaultLng = -0.09;

initializeMap(defaultLat, defaultLng);
