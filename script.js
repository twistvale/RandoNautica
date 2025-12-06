// --- Global Variables ---
let map;
let userMarker;
let randomMarker;
let routeLine; // Holds the line connecting the two points
const MAX_DISTANCE_KM = 2; // Maximum distance for the random spot

// --- Map Initialization Function ---
function initializeMap(lat, lng) {
    const defaultZoom = 15;
    
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

// --- Random Point Generation Function ---
function generateRandomPoint(centerLat, centerLng, radius) {
    // Approx. conversion of km to degrees near the equator
    const radiusInDegrees = radius / 111.32; 

    // Generate random distance (w) and angle (t)
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    // Calculate the new coordinates
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
            const userLatLng = [userLat, userLng]; 

            document.getElementById('status-message').textContent = `Location found. Generating random spot within ${MAX_DISTANCE_KM}km...`;
            
            initializeMap(userLat, userLng);
            
            const randomSpot = generateRandomPoint(userLat, userLng, MAX_DISTANCE_KM);
            const randomLatLng = [randomSpot.lat, randomSpot.lng];

            // 1. Update/Add Random Marker
            if (randomMarker) {
                map.removeLayer(randomMarker);
            }
            
            randomMarker = L.marker(randomLatLng).addTo(map)
            .bindPopup('Your Destination!').openPopup();


            // 2. Draw the Route Line (Polyline)
            if (routeLine) {
                map.removeLayer(routeLine);
            }
            
            const latlngs = [userLatLng, randomLatLng];
            
            routeLine = L.polyline(latlngs, {
                color: 'blue',
                weight: 5,
                opacity: 0.7,
                dashArray: '10, 10' // Makes the line dashed
            }).addTo(map);


            // Fit the map view to show both markers and the line
            const bounds = L.latLngBounds(userLatLng, randomLatLng);
            map.fitBounds(bounds, { padding: [50, 50] });

            // 3. Clear Coordinate Display (THE GUARANTEE)
            document.getElementById('status-message').innerHTML = `
                <span style="font-size: 1.2em; color: #4CAF50; font-weight: bold;">DESTINATION FOUND!</span>
                <br>
                <strong style="color: #333;">Latitude:</strong> ${randomSpot.lat.toFixed(6)}
                <br>
                <strong style="color: #333;">Longitude:</strong> ${randomSpot.lng.toFixed(6)}
            `;
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

// --- Initial map setup (Fixes the blank map box on load) ---
const defaultLat = 51.505; // London
const defaultLng = -0.09;

// Initializes the map on load to prevent the blank white box
initializeMap(defaultLat, defaultLng);
