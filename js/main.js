document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city-select');
    const getForecastBtn = document.getElementById('get-forecast-btn');
    const selectedCityName = document.getElementById('selected-city-name');
    const forecastContainer = document.getElementById('forecast-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    // Define major European cities with their approximate coordinates
    // Used Google Maps to get these coordinates for better accuracy.
    const europeanCities = {
        london: { name: 'London', lat: 51.5074, lon: -0.1278 },
        paris: { name: 'Paris', lat: 48.8566, lon: 2.3522 },
        rome: { name: 'Rome', lat: 41.9028, lon: 12.4964 },
        berlin: { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
        madrid: { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
        amsterdam: { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
        barcelona: { name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
        prague: { name: 'Prague', lat: 50.0755, lon: 14.4378 },
        vienna: { name: 'Vienna', lat: 48.2082, lon: 16.3738 },
        dublin: { name: 'Dublin', lat: 53.3498, lon: -6.2603 },
        lisbon: { name: 'Lisbon', lat: 38.7223, lon: -9.1393 },
        brussels: { name: 'Brussels', lat: 50.8503, lon: 4.3517 },
        copenhagen: { name: 'Copenhagen', lat: 55.6761, lon: 12.5683 },
        stockholm: { name: 'Stockholm', lat: 59.3293, lon: 18.0686 },
        warsaw: { name: 'Warsaw', lat: 52.2297, lon: 21.0122 },
        budapest: { name: 'Budapest', lat: 47.4979, lon: 19.0402 }
    };

    // Populate the dropdown with cities
    for (const key in europeanCities) {
        if (europeanCities.hasOwnProperty(key)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = europeanCities[key].name;
            citySelect.appendChild(option);
        }
    }

    // Event listener for the "Get Forecast" button
    getForecastBtn.addEventListener('click', () => {
        const selectedCityKey = citySelect.value;

        if (selectedCityKey) {
            const city = europeanCities[selectedCityKey];
            fetchWeather(city.lat, city.lon, city.name);
        } else {
            // Provide feedback if no city is selected
            errorMessage.textContent = 'Please select a city to get the forecast.';
            errorMessage.style.display = 'block';
            forecastContainer.innerHTML = ''; // Clear previous forecast
            selectedCityName.textContent = '';
        }
    });

    // Async function to fetch weather data from 7Timer API
    async function fetchWeather(lat, lon, cityName) {
        // Clear previous forecast, show loading message, hide error message
        forecastContainer.innerHTML = '';
        selectedCityName.textContent = `Loading forecast for ${cityName}...`;
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        // 7Timer! API endpoint for civil light forecast (7 days)
        // product=civillight gives a simplified 7-day forecast
        const apiUrl = `http://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                // Handle HTTP errors (e.g., 404, 500)
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.dataseries && data.dataseries.length > 0) {
                displayForecast(data.dataseries, cityName);
            } else {
                // Handle cases where data is returned but is empty or malformed
                throw new Error('No forecast data available for this city.');
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            loadingMessage.style.display = 'none';
            errorMessage.textContent = `Failed to load forecast for ${cityName}. Error: ${error.message}`;
            errorMessage.style.display = 'block';
            selectedCityName.textContent = ''; // Clear city name on error
        } finally {
            loadingMessage.style.display = 'none'; // Ensure loading message is hidden
        }
    }

    // Function to display the fetched forecast data
    function displayForecast(dataseries, cityName) {
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        forecastContainer.innerHTML = ''; // Clear existing cards
        selectedCityName.textContent = `7-Day Forecast for ${cityName}`;

        // Get current date to correctly calculate future dates
        const today = new Date();

        // 7Timer 'civillight' product typically returns data for 7 days
        // We'll iterate through the first 7 entries for the 7-day forecast.
        for (let i = 0; i < Math.min(dataseries.length, 7); i++) {
            const dayData = dataseries[i];
            const dateForCard = new Date(today); // Create a new Date object for each day
            dateForCard.setDate(today.getDate() + i); // Add 'i' days to today's date

            const dayName = dateForCard.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., Mon
            const monthName = dateForCard.toLocaleDateString('en-US', { month: 'short' }); // e.g., Jul
            const dayOfMonth = dateForCard.getDate(); // e.g., 24

            const weatherIconClass = getWeatherIconClass(dayData.weather);
            // The 7Timer API returns temperature in Celsius, so no conversion is needed.
            // We use .toFixed(0) to round the temperature to a whole number.
            const minTempC = dayData.temp2m.min.toFixed(0);
            const maxTempC = dayData.temp2m.max.toFixed(0);
            const windSpeed = dayData.wind10m_max; // Max wind speed at 10m in m/s

            const weatherDescription = getWeatherDescription(dayData.weather);

            const weatherCard = document.createElement('div');
            weatherCard.classList.add('weather-card');

            weatherCard.innerHTML = `
                <h3>${dayName}, ${monthName} ${dayOfMonth}</h3>
                <div class="weather-icon ${weatherIconClass}"></div>
                <p>${weatherDescription}</p>
                <p class="temperature">${minTempC}°C / ${maxTempC}°C</p>
                <p>Wind: ${windSpeed} m/s</p>
            `;
            forecastContainer.appendChild(weatherCard);
        }
    }

    // Helper function to map 7Timer weather codes to CSS classes for icons
    // Refer to 7Timer! documentation for a full list of weather codes:
    // http://www.7timer.info/doc.php?lang=en
    function getWeatherIconClass(weatherCode) {
        switch (weatherCode) {
            case 'clear': return 'icon-clear';
            case 'pcloudy': return 'icon-pcloudy'; // Partly Cloudy
            case 'cloudy': return 'icon-cloudy';    // Cloudy
            case 'lightrain': return 'icon-lightrain';// Light Rain
            case 'rain': return 'icon-rain';        // Rain
            case 'snow': return 'icon-snow';        // Snow
            case 'ts': return 'icon-ts';            // Thunderstorm
            case 'tsrain': return 'icon-tsrain';    // Thunderstorm with Rain
            case 'fog': return 'icon-fog';          // Fog
            case 'ishower': return 'icon-ishower';  // Isolated showers
            case 'mshower': return 'icon-mshower';  // Moderate showers
            case 'oshower': return 'icon-oshower';  // Occasional showers
            case 'sleet': return 'icon-sleet';      // Sleet
            case 'wind': return 'icon-wind';        // Windy (often combined with other conditions)
            case 'lightts': return 'icon-ts'; // Light thunderstorm - using ts icon
            case 'lightsnow': return 'icon-snow'; // Light snow - using snow icon

            // Default fallback if code is not matched
            default: return 'icon-default';
        }
    }

    // Helper function to provide human-readable descriptions for weather codes
    function getWeatherDescription(weatherCode) {
        switch (weatherCode) {
            case 'clear': return 'Clear Sky';
            case 'pcloudy': return 'Partly Cloudy';
            case 'cloudy': return 'Cloudy';
            case 'lightrain': return 'Light Rain';
            case 'rain': return 'Rainy';
            case 'snow': return 'Snowy';
            case 'ts': return 'Thunderstorm';
            case 'tsrain': return 'Thunderstorm with Rain';
            case 'fog': return 'Foggy';
            case 'ishower': return 'Isolated Showers';
            case 'mshower': return 'Moderate Showers';
            case 'oshower': return 'Occasional Showers';
            case 'sleet': return 'Sleet';
            case 'wind': return 'Windy';
            case 'lightts': return 'Light Thunderstorm';
            case 'lightsnow': return 'Light Snow';
            default: return 'Unknown';
        }
    }

    // Optional: Load forecast for a default city (e.g., London) on page load
    // This provides immediate content to the user.
    if (citySelect.value === "") { // Only if no city is pre-selected by browser
        citySelect.value = 'london';
        fetchWeather(europeanCities.london.lat, europeanCities.london.lon, europeanCities.london.name);
    }
});
