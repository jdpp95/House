class SunAngleCalculator {
    TO_RADIANS = Math.PI / 180;
    TO_DEGREES = 180 / Math.PI;

    constructor() { }

    getTimeFromSunAngle(sunAngle, location, date) {
        let { latitude, longitude, utc } = location;

        let dayOfYear = this.getDayOfYear(date);
        let declination = this.getDeclination(dayOfYear);
        let hourAngle = this.getHourAngleFromSunAngle(sunAngle, declination, latitude);
        let localStandardTimeMeridian = this.getLocalStandardTimeMeridian(utc);
        let equationOfTime = this.getEquationOfTime(dayOfYear);

        let timeCorrection = this.getTimeCorrection(longitude, localStandardTimeMeridian, equationOfTime);

        let localTime = 12 - timeCorrection / 60;

        return [localTime - hourAngle / 15, localTime + hourAngle / 15];
    }

    getSunAngleFromTime(time, location) {
        const unixDate = Date.parse(time) / 1000;
        return this.getSunAngleFromTimestamp(unixDate, location);
    }

    getSunAngleFromTimestamp(timestamp, location) {
        let { latitude, longitude, utc } = location;
        latitude *= this.TO_RADIANS;

        const date = new Date(timestamp * 1000);
        let dayOfYear = this.getDayOfYear(date);

        let declination = this.getDeclination(dayOfYear) * this.TO_RADIANS;
        let localTime = date.getUTCHours() + utc * 1 + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
        let hourAngle = this.getHourAngleFromLocalTime(longitude, dayOfYear, localTime, utc) * this.TO_RADIANS;

        return Math.asin(Math.sin(declination) * Math.sin(latitude)
            + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle)) * this.TO_DEGREES;
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const day = Math.floor(diff / (1000 * 60 * 60 * 24));
        return day;
    }

    getDeclination(dayOfYear) {
        return -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
    }

    getHourAngleFromLocalTime(longitude, dayOfYear, localTime, utc) {
        let equationOfTime = this.getEquationOfTime(dayOfYear);
        let localStandardTimeMeridian = this.getLocalStandardTimeMeridian(utc);
        let timeCorrection = this.getTimeCorrection(longitude, localStandardTimeMeridian, equationOfTime);
        let localSolarTime = localTime + timeCorrection / 60;

        return 15 * (localSolarTime - 12);
    }

    getHourAngleFromSunAngle(sunAngle, declination, latitude) {
        sunAngle *= this.TO_RADIANS;
        declination *= this.TO_RADIANS;
        latitude *= this.TO_RADIANS;

        return Math.acos((Math.sin(sunAngle) - Math.sin(declination) * Math.sin(latitude)) / (Math.cos(declination) * Math.cos(latitude))) * this.TO_DEGREES;
    }

    getTimeCorrection(longitude, localStandardTimeMeridian, equationOfTime) {
        return 4 * (longitude - localStandardTimeMeridian) + equationOfTime;
    }

    getEquationOfTime(dayOfYear) {
        let b = (2.0 * Math.PI / 365) * (dayOfYear - 81);
        return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    }

    getLocalStandardTimeMeridian(utc) {
        return utc * 15;
    }
}

const otherLocation = { latitude: 49.318, longitude: -54.708, utc: -3.5 };
const sunAngleCalculator = new SunAngleCalculator();
const otherDate = new Date(1959, 3, 7);

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

    getCurrentLocation((position) => {
        localStorage.setItem('coords', `${position.coords.latitude},${position.coords.longitude}`);
    });

    updateTime([0, 0]);
}

function updateTime(previousLocalTime) {
    setTimeout(() => {
        let otherLocalTime = getOtherTime();

        let diff1 = otherLocalTime[0] - previousLocalTime[0];
        let diff2 = otherLocalTime[1] - previousLocalTime[1];

        let rate = Math.abs(diff1) * 60 * 60;

        console.log(`Rate: ${rate.toFixed(1)}x`);

        // Which of the two local times is increasing?
        // diff1 is greater than diff2 before noon, diff2 is greater than diff 1 in the afternoon
        let localTime = diff1 > diff2 ? otherLocalTime[0] : otherLocalTime[1];

        let hour = Math.floor(localTime);
        let minutes = (localTime - hour) * 60;

        minutes = Math.floor(minutes);

        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        let formattedOtherTime = `${hour}:${minutes}`;

        if (isNaN(otherLocalTime[0])) {
            document.querySelector("#clock").innerHTML = "--:--";
        } else {
            document.querySelector("#clock").innerHTML = `${formattedOtherTime}`;
        }

        updateTime(otherLocalTime);
    }, 1000);
}

function onUpdateClicked() {
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

    colorHouse({ temperature: indoorTemperature2, floor: 3 });
    colorHouse({ temperature: indoorTemperature1, floor: 1 });
    colorSky({ temperature: outdoorTemperature, sunAngle, cloudiness: cloudCover / 100, rainIntensity, hasFog, visibility });
}

function colorHouse({ temperature, floor }) {
    const floor1 = document.querySelector('#floor-1');
    const floor2 = document.querySelector('#floor-2');
    const floor3 = document.querySelector('#floor-3');
    const floor4 = document.querySelector('#floor-4');

    const { hue, sat, lum } = colorT(temperature, 0, 0.5);
    const hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;

    switch (floor) {
        case 1:
        case 4:
            floor1.style.backgroundColor = hsl;
            floor4.style.backgroundColor = hsl;
            break;
        case 2:
        case 3:
            floor2.style.backgroundColor = hsl;
            floor3.style.backgroundColor = hsl;
            break;
    }
}

function colorSky({ temperature, sunAngle, cloudiness, rainIntensity, hasFog, visibility }) {
    const sky = document.querySelector('#sky');
    const clouds = document.querySelector('#clouds');
    const fog = document.querySelector('#fog');

    // Set background image
    const renderedCloudinessPercentage = getClosestPercentage(cloudiness);
    const cloudsUrl = `assets/clouds/clouds-${renderedCloudinessPercentage}.png`;
    clouds.style.backgroundImage = `url(${cloudsUrl})`;

    //Set stars if nightime
    drawStars(sunAngle);

    // Color sky and clouds
    const { hue, sat, lum } = colorT(temperature, sunAngle, 0, rainIntensity);
    const hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;
    let brightness = 0;
    const MIN_BRIGHTNESS = 0.3;
    const MAX_BRIGHTNESS = 1.45;

    if (sunAngle >= 0) {
        brightness = MAX_BRIGHTNESS;
    } else if (sunAngle <= -12) {
        brightness = MIN_BRIGHTNESS;
    } else {
        brightness = transition(MIN_BRIGHTNESS, MAX_BRIGHTNESS, -12, 0, sunAngle);
    }

    let grayscale = 0;
    const MIN_GRAYSCALE = 40;
    const MAX_GRAYSCALE = 100;

    if (rainIntensity > 1) {
        grayscale = transition(MIN_GRAYSCALE, MAX_GRAYSCALE, 1, 3, Math.pow(rainIntensity, 1 / 2));
    } else {
        grayscale = MIN_GRAYSCALE;
    }

    //Set fog
    if (!hasFog) {
        visibility = 5000;
    } else if (visibility == 0) {
        visibility = 1;
    }

    fog.style.opacity = `${129 - 15.3 * Math.log(visibility)}%`
    fog.style.filter = `brightness(${brightness})`;

    sky.style.backgroundColor = hsl;
    clouds.style.filter = `hue-rotate(${hue}deg) brightness(${brightness}) grayscale(${grayscale}%)`;
}

function drawStar(context, x, y) {
    context.beginPath();
    context.arc(x, y, 1.4, 0, 2 * Math.PI);
    context.strokeStyle = '#FFDF00';
    context.fillStyle = '#FFDF00';
    context.fill()
    context.stroke();
}

function drawStars(sunAngle) {
    const sky = document.querySelector('body');
    const starCanvas = document.querySelector('#stars').getContext('2d');

    // Compute width and height
    let width = sky.offsetWidth;
    let height = sky.offsetHeight;

    // Set canvas width and height
    starCanvas.canvas.width = width;
    starCanvas.canvas.height = height;

    const MAX_STARS = 100;

    let numberOfStars = 0;
    if (sunAngle <= -12) {
        numberOfStars = MAX_STARS;
    } else if (sunAngle < 0) {
        numberOfStars = MAX_STARS * -sunAngle / 12;
    }

    for (let i = 0; i < numberOfStars; i++) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);
        drawStar(starCanvas, x, y);
    }

}

// Approximates the cloudiness value to the closes renderizable percentage
function getClosestPercentage(cloudiness) {
    const percentages = [0, 17, 33, 50, 67, 83, 100];
    let closestPercentage = 0;
    let smallestDiff = 100;
    for (let percentage of percentages) {
        if (Math.abs(percentage - cloudiness * 100) < smallestDiff) {
            smallestDiff = Math.abs(percentage - cloudiness * 100);
            closestPercentage = percentage;
        }
    }

    return closestPercentage;
}

function transition(start1, end1, start2, end2, value2) {
    let ratio = (value2 - start2) / (end2 - start2);
    return start1 + (end1 - start1) * ratio;
}

function colorT(t, sunAngle, clouds, rainIntensity = 0) {

    t = t * 1.8 + 32; // Above algorithm works in Fahrenheit

    var hue;
    var sat;

    // Saturation
    if (clouds) {
        sat = (1 - clouds) * 40 + 60;
    } else {
        sat = 100;
    }

    if (rainIntensity >= 1) {
        sat = Math.max(60 - (rainIntensity - 1) * 10, 15);
    }

    // Lightness

    var lum = 0;

    const MAX_LUM = 50;
    const MIN_LUM = 15;

    if (t > 100) {
        lum = Math.max(150 - t, 10);
    } else if (sunAngle > 0) {
        lum = MAX_LUM;
    } else if (sunAngle < -12) {
        lum = MIN_LUM;
    } else {
        lum = transition(MAX_LUM, MIN_LUM, 0, -12, sunAngle)
    }

    // Hue

    let colors = [
        [0, 270],
        [14, 240],
        [32, 180],
        [44.6, 150],
        [50, 120],
        [55.4, 90],
        [68, 60],
        [80, 45],
        [90, 30],
        [100, 0],
        [100, 360],
        [125, 360]
    ];

    if (t <= 0) hue = 270;
    else if (t > 125) hue = 360;
    else {
        var index = 0;
        for (index = 0; index < colors.length - 2; index++) {
            if (t >= colors[index][0] && t < colors[index + 1][0]) {
                break;
            }
        }

        hue = transition(colors[index][1], colors[index + 1][1], colors[index][0], colors[index + 1][0], t);
    }

    sat = Math.round(sat);
    hue = Math.round(hue);
    lum = Math.round(lum);

    return { hue, sat, lum };
}

function onTestClicked() {

    let hourlySunAngles = [];

    for (let i = 0; i < 24; i++) {

        let millis = new Date(Date.UTC(1959, 3, 7)).getTime();
        millis += (i - otherLocation.utc) * 1000 * 60 * 60;

        let date = new Date(millis);
        let sunAngle = sunAngleCalculator.getSunAngleFromTime(date.toISOString(), otherLocation);
        hourlySunAngles.push(sunAngle);

        let position = localStorage.getItem('coords').split(",");
        let currentLocation = { latitude: position[0], longitude: position[1], utc: -5 };
        let otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(sunAngle, currentLocation, new Date());
        console.log(`//    { time: ${i}, temperature: t, sunAngle: ${sunAngle.toFixed(1)}}, clouds: c}, // ${formatLocalTime(otherLocalTime)}`);
    }
}

function formatLocalTime(localTime) {
    let localTimeArr = localTime.map((rawLocalTime) => {
        let hour = Math.floor(rawLocalTime);
        let percentage = Math.round((rawLocalTime - hour) * 100);
        return `${hour}h ${percentage}%`;
    });

    return localTimeArr.join('-');
}

function getOtherTime() {
    let position = localStorage.getItem('coords').split(',');
    let currentLocation = { latitude: position[0], longitude: position[1], utc: -5 };
    let currentSunAngle = sunAngleCalculator.getSunAngleFromTime(new Date(), currentLocation);
    let otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(currentSunAngle, otherLocation, otherDate);

    return otherLocalTime;
}

function getCurrentLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(callback, (e) => console.error(e));
    } else {
        console.error("Geolocation is not supported by this browser.")
    }
}