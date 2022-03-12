const otherLocation = { latitude: 47.663, longitude: -73.04, utc: -4 };
const sunAngleCalculator = new SunAngleCalculator();
const otherDate = new Date(Date.UTC(1960, 5, 12));
const timeTransformer = new TimeTransformer();

window.onload = () => {
    let weatherData = JSON.parse(localStorage.getItem('weatherData'));

    document.querySelector('#outdoorTemperature').value = weatherData.outdoorTemperature;
    document.querySelector('#indoorTemperature1').value = weatherData.indoorTemperature1;
    document.querySelector('#indoorTemperature2').value = weatherData.indoorTemperature2;
    document.querySelector('#cloudCover').value = weatherData.cloudCover;
    document.querySelector('#sunAngle').value = weatherData.sunAngle;
    document.querySelector('#rainIntensity').value = weatherData.rainIntensity;
    document.querySelector('#visibility').value = weatherData.visibility;

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
    })

    onUpdateClicked();

    timeTransformer.getCurrentLocation((position) => {
        localStorage.setItem('coords', `${position.coords.latitude},${position.coords.longitude}`);
    });

    timeTransformer.updateTime();

    var gradient = new Gradient();
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

    let isRaining = document.querySelector('#isRainingCheckbox').checked;
    if (isRaining) {
        cloudCover = 100;
    } else {
        rainIntensity = 0;
    }

    const weatherData = { outdoorTemperature, indoorTemperature1, indoorTemperature2, cloudCover, sunAngle, rainIntensity, hasFog, visibility };
    localStorage.setItem('weatherData', JSON.stringify(weatherData));

    houseRenderer.colorHouse({ temperature: indoorTemperature2, floor: 3 });
    houseRenderer.colorHouse({ temperature: indoorTemperature1, floor: 1 });
    houseRenderer.colorSky({ temperature: outdoorTemperature, sunAngle, cloudiness: cloudCover / 100, rainIntensity, hasFog, visibility });
}

function onTestClicked() {
    timeTransformer.printHourlySunAngles();
}