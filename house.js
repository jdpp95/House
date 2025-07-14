const sunAngleCalculator = new SunAngleCalculator();
const timeTransformer = new TimeTransformer();
let gradient;

$(document).ready(() => {
    $('#datetimepicker1').datepicker({
        format: 'dd/mm/yyyy'
    });
});

window.onload = () => {
    let weatherData = JSON.parse(localStorage.getItem('weatherData'));

    document.querySelector('#outdoorTemperature').value = weatherData.outdoorTemperature;
    document.querySelector('#indoorTemperature1').value = weatherData.indoorTemperature1;
    document.querySelector('#indoorTemperature2').value = weatherData.indoorTemperature2;
    document.querySelector('#cloudCover').value = weatherData.cloudCover;
    document.querySelector('#sunAngle').value = weatherData.sunAngle;
    document.querySelector('#rainIntensity').value = weatherData.rainIntensity;
    document.querySelector('#visibility').value = weatherData.visibility;
    document.querySelector("#isRainingCheckbox").checked = weatherData.isRaining;
    document.querySelector("#hasFog").checked = weatherData.hasFog;
    document.querySelector("#hasHeating").checked = weatherData.hasHeating;

    document.querySelector("#datetimepicker1").onchange = onDateChanged;
    document.querySelector("#geolocation-button").onclick = onGeoLocationButtonClicked;
    
    let coordsInput = document.querySelector('#coords');
    coordsInput.onchange = updateLocationData;
    
    let utcInput = document.querySelector('#utc');
    utcInput.onchange = updateLocationData;
    
    let { utc, coords } = JSON.parse(localStorage.getItem('locationData'));
    coordsInput.value = coords;
    utcInput.value = utc;

    let isRainingCheckbox = document.querySelector('#isRainingCheckbox');

    isRainingCheckbox.addEventListener('change', e => {

        let cloudCoverControl = document.querySelector('#cloudCoverControl');
        let rainIntensityControl = document.querySelector('#rainIntensityControl');

        if (e.target.checked) {
            cloudCoverControl.style.display = 'none';
            rainIntensityControl.style.display = 'flex';
        } else {
            cloudCoverControl.style.display = 'flex';
            rainIntensityControl.style.display = 'none';
        }
    });

    let hasFogCheckbox = document.querySelector("#hasFog");
    hasFogCheckbox.addEventListener('change', e => {
        let visibilityInputGroup = document.querySelector('#visibilityInputGroup');

        if (e.target.checked) {
            visibilityInputGroup.style.display = 'flex';
        } else {
            visibilityInputGroup.style.display = 'none';
        }
    });

    $('#datetimepicker1').datepicker('setUTCDate', new Date(localStorage.getItem('otherDate')));
    onDateChanged();
    onUpdateClicked();
    let locationData = parseLocationData({ coords, utc });
    timeTransformer.updateTime(locationData);
    gradient = new Gradient(timeTransformer);
}

function parseLocationData(rawLocation) {
    let { coords, utc } = rawLocation;

    let locationData = {};
    locationData.latitude = coords.split(",")[0];
    locationData.longitude = coords.split(",")[1];
    locationData.utc = utc;

    return locationData;
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
    let houseRenderer = new HouseRenderer();

    let outdoorTemperature = document.querySelector('#outdoorTemperature').value;
    let indoorTemperature1 = document.querySelector('#indoorTemperature1').value;
    let indoorTemperature2 = document.querySelector('#indoorTemperature2').value;
    let sunAngle = document.querySelector('#sunAngle').value;
    let cloudCover = document.querySelector('#cloudCover').value;
    let rainIntensity = document.querySelector('#rainIntensity').value;
    let hasFog = document.querySelector("#hasFog").checked;
    let visibility = document.querySelector("#visibility").value;
    let hasHeating = document.querySelector("#hasHeating").checked;

    let isRaining = document.querySelector('#isRainingCheckbox').checked;
    if (isRaining) {
        cloudCover = 100;
    } else {
        rainIntensity = 0;
    }

    const weatherData = { outdoorTemperature, indoorTemperature1, indoorTemperature2, cloudCover, sunAngle, rainIntensity, hasFog, visibility, isRaining, hasHeating };
    localStorage.setItem('weatherData', JSON.stringify(weatherData));

    houseRenderer.colorHouse({ outsideTemperature: outdoorTemperature, temperature: indoorTemperature2, floor: 3, hasHeating });
    houseRenderer.colorHouse({ outsideTemperature: outdoorTemperature, temperature: indoorTemperature1, floor: 1, hasHeating });

    const THERMOMETHER_DIFF = 1.5;
    
    document.getElementById("thermometer-display").innerHTML = (Number(outdoorTemperature) + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-1-casement").innerHTML = (indoorTemperature1 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-2").innerHTML =          (indoorTemperature2 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-3").innerHTML =          (indoorTemperature2 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";
    document.getElementById("window-4").innerHTML =          (indoorTemperature1 * 1 + THERMOMETHER_DIFF).toFixed(1) + "°C";

    houseRenderer.colorSky({ temperature: outdoorTemperature, sunAngle, cloudiness: cloudCover / 100, rainIntensity, hasFog, visibility });
}

function onTestClicked() {
    let outdoorTemperatureElement = document.querySelector("#outdoorTemperature");
    let indoorTemperature1Element = document.querySelector("#indoorTemperature1");
    let indoorTemperature2Element = document.querySelector("#indoorTemperature2");
    let sunAngleElement = document.querySelector("#sunAngle");
    let cloudCoverElement = document.querySelector("#cloudCover");
    let rainIntensityElement = document.querySelector("#rainIntensity");
    let hasFogElement = document.querySelector("#hasFog");
    let hasHeatingElement = document.querySelector("#hasHeating");
    let visibilityElement = document.querySelector("#visibility");
    let isRainingElement = document.querySelector("#isRainingCheckbox");

    let gradientData = gradient.getGradientData();

    let lastIndex = gradientData.length - 1;
    let lastItem = gradientData[lastIndex];

    sunAngleElement.value = lastItem.sunAngle.toFixed(1);
    outdoorTemperatureElement.value = lastItem.temperature.toFixed(1);
    cloudCoverElement.value = (lastItem.clouds * 100).toFixed(0);

    let rainIntensity = 0;

    if(lastItem.clouds > 1) {
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