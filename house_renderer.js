class HouseRenderer {
    colorTemperature = new ColorTemperature();
    utils = new Utils();
    canvas;

    constructor() {
        this.canvas = fx.canvas();
    }

    colorHouse({ temperature, floor }) {
        const floor1 = document.querySelector('#floor-1');
        const floor2 = document.querySelector('#floor-2');
        const floor3 = document.querySelector('#floor-3');
        const floor4 = document.querySelector('#floor-4');

        const { hue, sat, lum } = this.colorTemperature.colorT(temperature, 0, 0.5);
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

    colorSky({ temperature, sunAngle, cloudiness, rainIntensity, hasFog, visibility }) {
        const sky = document.querySelector('#sky');
        const fog = document.querySelector('#fog');

        //Set stars if nightime
        this.drawStars(sunAngle);

        // Color sky and clouds
        const { hue, sat, lum } = this.colorTemperature.colorT(temperature, sunAngle, 0, rainIntensity);
        const hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;
        let brightness = 0;
        const MIN_FOG_BRIGHTNESS = 0.3;
        const MAX_FOG_BRIGHTNESS = 1.45;

        if (sunAngle >= 0) {
            brightness = MAX_FOG_BRIGHTNESS;
        } else if (sunAngle <= -12) {
            brightness = MIN_FOG_BRIGHTNESS;
        } else {
            brightness = this.utils.transition(MIN_FOG_BRIGHTNESS, MAX_FOG_BRIGHTNESS, -12, 0, sunAngle);
        }

        let grayscale = 0;
        const MIN_GRAYSCALE = -0.5;
        const MAX_GRAYSCALE = -1;

        if (rainIntensity > 1) {
            grayscale = this.utils.transition(MIN_GRAYSCALE, MAX_GRAYSCALE, 0, 3, Math.pow(rainIntensity, 1 / 2));
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

        // Set background image
        this.drawClouds(cloudiness, grayscale, hue, sunAngle);
    }

    drawClouds(cloudiness, grayscale, hue, sunAngle) {
        const renderedCloudinessPercentage = this.getClosestPercentage(cloudiness);
        const cloudsUrl = `https://raw.githubusercontent.com/jdpp95/House/master/assets/clouds/clouds-${renderedCloudinessPercentage}.png`;

        // DOM Manipulation

        const clouds = document.querySelector('#clouds');
        const cloudsImg = document.createElement('img');
        cloudsImg.src = cloudsUrl;
        cloudsImg.crossOrigin = "anonymous";

        // Color manipulation

        const MIN_CLOUD_BRIGHTNESS = -0.45;
        const MAX_CLOUD_BRIGHTNESS = 0;
        const MIN_CSS_BRIGHTNESS = 0.3;
        const MAX_CSS_BRIGHTNESS = 1;

        let cloudBrightness, cssBrightness;
        if (sunAngle >= 0) {
            cloudBrightness = MAX_CLOUD_BRIGHTNESS;
            cssBrightness = MAX_CSS_BRIGHTNESS;
        } else if (sunAngle <= -12) {
            cloudBrightness = MAX_CLOUD_BRIGHTNESS;
            cssBrightness = MIN_CSS_BRIGHTNESS;
        } else {
            cloudBrightness = this.utils.transition(MIN_CLOUD_BRIGHTNESS, MAX_CLOUD_BRIGHTNESS, -12, 0, sunAngle);
            cssBrightness = this.utils.transition(MIN_CSS_BRIGHTNESS, MAX_CSS_BRIGHTNESS, -12, 0, sunAngle);
        }

        //Convert hue to API's value
        let otherHue = (hue - 180) / 180;
        if (otherHue < 0) {
            otherHue += 1;
        } else {
            otherHue -= 1;
        }

        cloudsImg.onload = () => {
            let texture = this.canvas.texture(cloudsImg);
            this.canvas.draw(texture).hueSaturation(otherHue, 0).brightnessContrast(0, grayscale).update();

            clouds.innerHTML = '';
            clouds.appendChild(cloudsImg);
            cloudsImg.parentNode.insertBefore(this.canvas, cloudsImg);
            cloudsImg.parentNode.removeChild(cloudsImg);

            clouds.style.filter = `brightness(${brightness})`;
        }
    }

    drawStar(context, x, y) {
        context.beginPath();
        context.arc(x, y, 1.4, 0, 2 * Math.PI);
        context.strokeStyle = '#FFDF00';
        context.fillStyle = '#FFDF00';
        context.fill()
        context.stroke();
    }

    drawStars(sunAngle) {
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
            this.drawStar(starCanvas, x, y);
        }
    }


    // Approximates the cloudiness value to the closes renderizable percentage
    getClosestPercentage(cloudiness) {
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
}