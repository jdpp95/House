const sunAngleCalculator = new SunAngleCalculator();
const timeTransformer = new TimeTransformer();
let gradient;

$(document).ready(() => {
    $('#datetimepicker1').datepicker({
        format: 'dd/mm/yyyy'
    });
});

function initializeWeatherForm({ outdoorTemperature, indoorTemperature1, indoorTemperature2, cloudCover, humidity, sunAngle, rainIntensity, visibility, isRaining, hasFog, hasHeating }) {
    document.querySelector('#outdoorTemperature').value = outdoorTemperature;
    document.querySelector('#indoorTemperature1').value = indoorTemperature1;
    document.querySelector('#indoorTemperature2').value = indoorTemperature2;
    document.querySelector('#humidity').value = humidity;
    document.querySelector('#cloudCover').value = cloudCover;
    document.querySelector('#sunAngle').value = sunAngle;
    document.querySelector('#rainIntensity').value = rainIntensity;
    document.querySelector('#visibility').value = visibility;
    setVisibilityVisibility({ isVisibilityVisible: hasFog})
    document.querySelector("#isRainingCheckbox").checked = isRaining;
    document.querySelector("#hasFog").checked = hasFog;
    document.querySelector("#hasHeating").checked = hasHeating;
}

function setupEventListeners() {
    document.querySelector("#datetimepicker1").onchange = onDateChanged;
    document.querySelector("#geolocation-button").onclick = onGeoLocationButtonClicked;

    let coordsInput = document.querySelector('#coords');
    coordsInput.onchange = updateLocationData;

    let utcInput = document.querySelector('#utc');
    utcInput.onchange = updateLocationData;
}

function initializeLocationData() {
    let { utc, coords } = JSON.parse(localStorage.getItem('locationData'));
    let coordsInput = document.querySelector('#coords');
    let utcInput = document.querySelector('#utc');
    coordsInput.value = coords;
    utcInput.value = utc;
    return { coords, utc };
}

function setupRainControls() {
    let isRainingCheckbox = document.querySelector('#isRainingCheckbox');
    isRainingCheckbox.addEventListener('change', e => {
        let cloudCoverControl = document.querySelector('#cloudCoverControl');
        let rainIntensityControl = document.querySelector('#rainIntensityControl');

        cloudCoverControl.style.display = e.target.checked ? 'none' : 'flex';
        rainIntensityControl.style.display = e.target.checked ? 'flex' : 'none';
    });
}

function setupFogControls() {
    let hasFogCheckbox = document.querySelector("#hasFog");
    hasFogCheckbox.addEventListener('change', e => {
        setVisibilityVisibility({ isVisibilityVisible: e.target.checked });
    });
}

// Sets the visibility input group visibility based on whether fog is enabled
function setVisibilityVisibility({ isVisibilityVisible }) {
    let visibilityInputGroup = document.querySelector('#visibilityInputGroup');
    visibilityInputGroup.style.display = isVisibilityVisible ? 'flex' : 'none';
}

function initializeLocationData() {
    let { coords, utc } = JSON.parse(localStorage.getItem('locationData'));
    let coordsInput = document.querySelector('#coords');
    let utcInput = document.querySelector('#utc');

    coordsInput.value = coords;
    utcInput.value = utc;

    return { coords, utc };
}

function parseUrlParams(urlParams) {
    const paramMap = {
        t: 'outdoorTemperature',
        it1: 'indoorTemperature1',
        it2: 'indoorTemperature2',
        rh: 'humidity',
        cc: 'cloudCover',
        ri: 'rainIntensity',
        sa: 'sunAngle',
        v: 'visibility',
    };
    return urlParams.keys().reduce((acc, param) => {
        const key = paramMap[param];
        return { ...acc, [key]: urlParams.get(param) };
    }, {});
}

window.onload = () => {
    // Initialize weather data
    const urlParams = new URLSearchParams(window.location.search);
    let weatherData = urlParams.size > 0 ? parseUrlParams(urlParams) : JSON.parse(localStorage.getItem('weatherData'));
    this.initializeWeatherForm(weatherData);

    // Setup event listeners
    setupEventListeners();
    setupRainControls();
    setupFogControls();

    // Initialize location and date
    let { coords, utc } = initializeLocationData();

    $('#datetimepicker1').datepicker('setUTCDate', new Date(localStorage.getItem('otherDate')));

    // Update application state
    onDateChanged();
    onUpdateClicked();
    let locationData = parseLocationData({ coords, utc });
    timeTransformer.updateTime(locationData);
    gradient = new Gradient(timeTransformer);
}

function parseLocationData({ coords, utc }) {
    const [latitude, longitude] = coords.split(',');
    return { latitude, longitude, utc };
}

function onDateChanged() {
    otherDate = $('#datetimepicker1').datepicker('getUTCDate');
    timeTransformer.setDate(otherDate);
}

function updateLocationData() {
    let coordsInput = document.querySelector("#coords");
    let utcInput = document.querySelector("#utc");

    let coords = coordsInput.value;
    let utc = utcInput.value;

    let locationData = { coords, utc };
    localStorage.setItem('locationData', JSON.stringify(locationData));
}

function onUpdateClicked() {
    const houseRenderer = new HouseRenderer();

    const outdoorTemperature = document.querySelector('#outdoorTemperature').value;
    const indoorTemperature1 = document.querySelector('#indoorTemperature1').value;
    const indoorTemperature2 = document.querySelector('#indoorTemperature2').value;
    const sunAngle = document.querySelector('#sunAngle').value;
    const humidity = document.querySelector('#humidity').value;
    let cloudCover = document.querySelector('#cloudCover').value;
    let rainIntensity = document.querySelector('#rainIntensity').value;
    const hasFog = document.querySelector("#hasFog").checked;
    const visibility = document.querySelector("#visibility").value;
    const hasHeating = document.querySelector("#hasHeating").checked;

    const isRaining = document.querySelector('#isRainingCheckbox').checked;
    if (isRaining) {
        cloudCover = 100;
    } else {
        rainIntensity = 0;
    }

    // TODO: Get humidity from somewhere

    const weatherData = { outdoorTemperature, indoorTemperature1, indoorTemperature2, cloudCover, sunAngle, rainIntensity, hasFog, visibility, isRaining, hasHeating, humidity };
    localStorage.setItem('weatherData', JSON.stringify(weatherData));

    houseRenderer.colorHouse({ outsideTemperature: outdoorTemperature, temperature: indoorTemperature2, floor: 3, hasHeating });
    houseRenderer.colorHouse({ outsideTemperature: outdoorTemperature, temperature: indoorTemperature1, floor: 1, hasHeating });

    const THERMOMETHER_DIFF = 1.5;

    document.getElementById("thermometer-display").innerHTML = (Number(outdoorTemperature) + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-1-casement").innerHTML = (indoorTemperature1 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-2").innerHTML = (indoorTemperature2 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-3").innerHTML = (indoorTemperature2 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-4").innerHTML = (indoorTemperature1 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";

    houseRenderer.colorSky({ temperature: outdoorTemperature, sunAngle, cloudiness: cloudCover / 100, rainIntensity, hasFog, visibility, humidity: humidity / 100 });
}

function onGradientDataClicked() {
    const outdoorTemperatureElement = document.querySelector("#outdoorTemperature");
    const indoorTemperature1Element = document.querySelector("#indoorTemperature1");
    const indoorTemperature2Element = document.querySelector("#indoorTemperature2");
    const humidityElement = document.querySelector("#humidity");
    const sunAngleElement = document.querySelector("#sunAngle");
    const cloudCoverElement = document.querySelector("#cloudCover");
    const rainIntensityElement = document.querySelector("#rainIntensity");
    const hasFogElement = document.querySelector("#hasFog");
    const hasHeatingElement = document.querySelector("#hasHeating");
    const visibilityElement = document.querySelector("#visibility");
    const isRainingElement = document.querySelector("#isRainingCheckbox");

    let gradientData = gradient.getGradientData();

    let lastIndex = gradientData.length - 1;
    let lastItem = gradientData[lastIndex];

    sunAngleElement.value = lastItem.sunAngle.toFixed(1);
    humidityElement.value = (lastItem.humidity * 100).toFixed(0);
    outdoorTemperatureElement.value = lastItem.temperature.toFixed(1);
    cloudCoverElement.value = (lastItem.clouds * 100).toFixed(0);

    let rainIntensity = 0;

    if (lastItem.clouds > 1) {
        rainIntensity = lastItem.clouds - 1;
        isRainingElement.checked = true;
        document.querySelector("#rainIntensityControl").style.display = 'flex';
        rainIntensityElement.value = Math.pow(rainIntensity + 1, 3).toFixed(1);
        document.querySelector("#cloudCoverControl").style.display = 'none';
    } else {
        isRainingElement.checked = false;
        document.querySelector("#rainIntensityControl").style.display = 'none';
        document.querySelector("#cloudCoverControl").style.display = 'flex';
    }

    hasHeatingElement.checked = lastItem.hasHeating;

    indoorTemperature1Element.value = lastItem.floor1.toFixed(1);
    indoorTemperature2Element.value = lastItem.floor3.toFixed(1);
}

function onGeoLocationButtonClicked() {
    timeTransformer.getCurrentLocation((position) => {
        localStorage.setItem('coords', `${position.coords.latitude},${position.coords.longitude}`);
        let locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            utc: -5 //TODO: Hardcoded UTC
        };
        timeTransformer.updateTime(locationData);
    });
}