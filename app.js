const LAT = 1.3521;
const LON = 103.8198;
async function getWeatherData(){
    try{
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code`);
        const data = await response.json();
        displayWeather(data.current);
    } catch(error){
        console.error("Error fetching weather:", error);
        document.getElementById("loading").innerText = "failed to load weather data.";
    }
}
function displayWeather(current) {
    document.getElementById("loading").classlist.add("hidden");
    document.getElementById("weatherInfo").classlist.remove("hidden");
    document.getElementById("tempValue").innerText = current.temperature_2m;
    let condition = "Clear & Sunny ☀️";
    if (current.precipitation > 0) condition = "Rainy / Wet 🌧️";
    else if(current.wind_speed_10m > 20) condition = "Windy 💨";
    document.getElementById("conditionText").innerText = condition;
    let score = 100;
    if(current.precipitation >0) score -=40;
    if (current.temperature_2m < 15 || current.temperature_2m > 35) score -=20;
    if (current.wind_speed_10m > 25) score -= 20;
    document.getElementById("outsideScore").querySelector("span").innerText = `${score/100}`;
}
getWeatherData();