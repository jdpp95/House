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
