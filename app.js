const DEFAULT_LAT = 1.3521;
const DEFAULT_LON = 103.8198;

document.addEventListener("DOMContentLoaded",()=>{
const themeToggle = document.getElementById("themeToggle");
if(themeToggle){
    if(localStorage.getItem("theme")==="dark"){
        document.body.classList.add("dark-mode");
        themeToggle.innerText = "☀️Light Mode";
    }
    themeToggle.addEventListener("click",()=>{
        document.body.classList.toggle("dark-mode");
        const isDarkMode = document.body.classList.contains("dark-mode");
        if (isDarkMode){
            themeToggle.innerText ="☀️Light Mode";
            localStorage.setItem("theme", "dark");
        } else{
            themeToggle.innerText ="🌙Dark mode";
            localStorage.setItem("theme","light");
        }
    });
}
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
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&forecast_days=3&timezone=auto`;
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5`;
        const [weatherRes, airQualityRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(airQualityUrl)
        ]);
        const data = await weatherRes.json();
        const airData = await airQualityRes.json();
        displayWeather(data.current,locationDisplayName);

        if(data.daily){
            renderForecast(data.daily);
        }
        if (data.hourly){
            renderHourlyForecast(data.hourly);
        }
        const maxUvToday = data.daily?.uv_index_max?.[0] ?? 0;
        const currentPm25 = airData.current?.pm2_5 ?? 0;
        renderEnvironmentMetrics(maxUvToday,currentPm25);
    } catch(error){
        console.error("Error fetching weather:", error);
        document.getElementById("loading").innerText = "failed to load weather data.";
    }
}
function renderEnvironmentMetrics(uvIndex, pm25){
    const uvValueEl = document.getElementById("uvValue");
    const uvstatusEl = document.getElementById("uvStatus");
    const aqiValueEl = document.getElementById("aqiValue");
    const aqiStatusEl = document.getElementById("aqiStatus");
    if (!uvValueEl || !aqiValueEl) return;
    uvValueEl.innerText = `${uvIndex.toFixed(1)}`;
    uvstatusEl.className = "metric-status";

    if(uvIndex <=2){
        uvstatusEl.innerText = "Low Risk 🟢";
        uvstatusEl.classList.add("good");
    } else if (uvIndex <= 5){
        uvstatusEl.innerText = "Moderate Risk 🟡";
        uvstatusEl.classList.add("moderate");
    } else if (uvIndex <= 7) {
        uvstatusEl.innerText = "High Risk 🟠";
        uvstatusEl.classList.add("moderate");
    } else {
        uvstatusEl.innerText = "Very High/Extreme Risk 🔴";
        uvstatusEl.classList.add("unhealthy");
    }
    aqiValueEl.innerText = `${pm25.toFixed(1)} µg/m³`;
    aqiStatusEl.innerText = "metric-status";

    if(pm25 <=12){
        aqiStatusEl.innerText = "Good Air Quality 🟢";
        aqiStatusEl.classList.add("good");
    } else if (pm25 <= 35.4){
        aqiStatusEl.innerText = "Moderate Air Quality 🟡";
        aqiStatusEl.classList.add("moderate");
    } else {
        aqiStatusEl.innerText = "Unhealthy Air Quality 🔴";
        aqiStatusEl.classList.add("unhealthy");
    }
}
function renderForecast(daily){
    console.log("renderForecast called with data:", daily);
    const grid = document.getElementById("forecast-grid");
    if (!grid){
        console.error("Error, #forecast-grid element not found in HTML!")
        return;
    } 
    grid.innerHTML = "";
    const dates = daily.time;
    const maxTemps = daily.temperature_2m_max;
    const minTemps = daily.temperature_2m_min;
    const precips = daily.precipitation_sum;
    dates.forEach((dateStr, i)=>{
        const dateObj = new Date(dateStr);
        const dayName = i === 0? "Today": dateObj.toLocaleDateString("en-US",{weekday: "short", month: "short",day:"numeric"});
        const card=document.createElement("div");
        card.className="forecast-card";
        card.innerHTML = `
        <div class="date">${dayName}</div>
        <div class="temp-range">${Math.round(minTemps[i])}°C - ${Math.round(maxTemps[i])}°C</div>
        <div class="precip">🌧️ ${precips[i]} mm precip</div>
        `;
        grid.appendChild(card);
    })
}
function renderHourlyForecast(hourly){
    const container = document.getElementById("hourlyGrid");
    if (!container) return;
    container.innerHTML = "";
    const times = hourly.time;
    const temps = hourly.temperature_2m;
    const precips = hourly.precipitation_probability;
    const now = new Date();
    let startIndex = 0;
    for (let i=0; i<times.length; i++){
        if (new Date(times[i])>= now){
            startIndex = i;
            break;
        }
    }
    const endIndex = Math.min(startIndex + 24, times.length);
    for (let i = startIndex; i<endIndex; i++){
        const dateObj = new Date(times[i]);
        const timeString = dateObj.toLocaleTimeString("en-US",{hour: "numeric", hour12:true});
        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
        <div class="time">${timeString}</div>
        <div class="temp">${Math.round(temps[i])}°C</div>
        <div class="precip-prob">🌧️ ${precips[i]}%</div>
        `;
        container.appendChild(card);
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

    const alertEl = document.getElementById("weatherAlert");
    alertEl.className = "alert-banner hidden";
    if(current.precipitation > 2.0){
        alertEl.innerText = "⚠️ Heavy rainfall detected. Consider staying indoors!";
        alertEl.classList.add("danger","alert-banner");
        alertEl.classList.remove("hidden");
    } else if (current.wind_speed_10m > 25){
        alertEl.innerText = "💨 High wind speeds advisory in effect.";
        alertEl.classList.add("warning","alert-banner");
        alertEl.classList.remove("hidden");
    } else if(current.temperature_2m > 35){
        alertEl.innerText = "🔥 High temperature warning. Stay hydrated";
        alertEl.classList.add("warning","alert-banner");
        alertEl.classList.remove("hidden");
    }
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