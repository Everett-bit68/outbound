const DEFAULT_LAT = 1.3521;
const DEFAULT_LON = 103.8198;

document.addEventListener("DOMContentLoaded",()=>{
    getUserLocation();
    const searchForm = document.getElementById("searchForm");
    if (searchForm){
        searchForm.addEventListener("submit",(e)=>{
            e.preventDefault();
            const cityInput = document.getElementById("cityInput").value.trim();
            if (cityInput){
                searchCity(cityInput);
            }
        });
    }
});

async function searchCity(cityName){
    const loadingEl = document.getElementById("loading");
    const weatherInfoEl = document.getElementById("weather-info");
    loadingEl.innerText = `Searching for ${cityName}...`;
    loadingEl.classList.remove('hidden');
    weatherInfoEl.classList.add("hidden");
    try{
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`)
        const data = await response.json();
        if(data.results && data.results.length>0){
            const result = data.results[0];
            const displayName = result.country? `${result.name}, ${result.country}` : result.name;
            fetchWeatherData(result.latitude, result.longitude, displayName);
        } else {
            loadingEl.innerText = `City "${cityName}" not found. Try another search.`;
        }
    } catch (error){
        console.error("Geocoding fetch error;", error);
        loadingEl.innerText = "Error searching for city.";
    }
}
function getUserLocation(){
    const locationNameEl =document.getElementById("locationName");
    if(navigator.geolocation){
        const options = {
            timeout: 5000,
            maximumAge: 0
        };
        locationNameEl.innerText ="Detecting location...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData(lat,lon,"Your live Location"); 
            },
            (error) => {
                console.warn("Geolocation permission denied or failed. Using default location.", error);
                fetchWeatherData(DEFAULT_LAT, DEFAULT_LON, "Singapore");
            }
        );
    } else{
        console.warn("Geolocation not supported. Using default location.");
        fetchWeatherData(DEFAULT_LAT, DEFAULT_LON, "Singapore");
    }
}

async function fetchWeatherData(lat,lon,locationDisplayName){
    try{
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code`);
        const data = await response.json();
        displayWeather(data.current, locationDisplayName);
    } catch(error){
        console.error("Error fetching weather:", error);
        document.getElementById("loading").innerText = "failed to load weather data.";
    }
}

function displayWeather(current, locationName) {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("weather-info").classList.remove("hidden");
    document.getElementById("locationName").innerText= locationName;
    document.getElementById("tempvalue").innerText = `${current.temperature_2m}°C`;
    let condition = "Clear & Sunny ☀️";
    if (current.precipitation > 0) condition = "Rainy / Wet 🌧️";
    else if(current.wind_speed_10m > 20) condition = "Windy 💨";
    document.getElementById("condition-Text").innerText = condition;
    let score = 100;
    if(current.precipitation >0) score -=40;
    if (current.temperature_2m < 15 || current.temperature_2m > 35) score -=20;
    if (current.wind_speed_10m > 25) score -= 20;
    const finalScore = Math.max(0, score);
    document.getElementById("outsideScore").innerHTML= `Outside Score: <span>${finalScore}/100</span>`;
    renderActivities(finalScore);
}

function renderActivities(score){
    const list = document.getElementById("activity-list");
    if(!list) return;
    list.innerHTML ="";

    const activities = [
        { name: "Jogging", min: 70},
        { name: "Cycling", min: 80},
        { name: "Park Walk", min: 50},
        { name: "Photography", min: 60}
    ];
    activities.forEach(act =>{
        const card = document.createElement("div");
        card.className = "activity-card";
        let status = "Great Condition!";
        if (score < act.min && score >=40){
            card.className +=" caution";
            status = "Proceed with caution";
        } else if (score < 40){
            card.className += " avoid";
            status = "Not recommended";
        }
        card.innerHTML = `<h4>${act.name}</h4><p>${status}</p>`;
        list.appendChild(card);
    });
}