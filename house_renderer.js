class HouseRenderer {
    colorTemperature = new ColorTemperature();
    utils = new Utils();
    canvas;

    constructor() {
        this.canvas = fx.canvas();
    }

    colorHouse({ outsideTemperature, temperature, floor, hasHeating }) {
        const floor1 = document.querySelector('#floor-1');
        const floor2 = document.querySelector('#floor-2');
        const floor3 = document.querySelector('#floor-3');
        const floor4 = document.querySelector('#floor-4');

        let heatingTemperature = temperature * 1 + (temperature - outsideTemperature);

        const roomTempHSL = this.colorTemperature.colorT(temperature, 0, 0.5);
        const middleHSL = this.colorTemperature.colorT((temperature * 1 + outsideTemperature * 1) / 2, 0, 0.5);
        const heatingTempHSL = this.colorTemperature.colorT(heatingTemperature, 0, 0.5);

        const roomTempHslString = this.hslStringify(roomTempHSL);
        const middleHSLString = this.hslStringify(middleHSL);
        const heatingTempHSLString = this.hslStringify(heatingTempHSL);

        let backgroundString = this.heatingGradientStringify(roomTempHslString, middleHSLString, heatingTempHSLString);

        switch (floor) {
            case 1:
            case 4:
                if (hasHeating) {
                    floor1.style.background = backgroundString;
                    floor4.style.background = backgroundString;
                } else {
                    floor1.style.background = "";
                    floor4.style.background = "";

                    floor1.style.backgroundColor = roomTempHslString;
                    floor4.style.backgroundColor = roomTempHslString;
                }
                break;
            case 2:
            case 3:
                if (hasHeating) {
                    floor2.style.background = backgroundString;
                    floor3.style.background = backgroundString;
                } else {
                    floor2.style.background = "";
                    floor3.style.background = "";

                    floor2.style.backgroundColor = roomTempHslString;
                    floor3.style.backgroundColor = roomTempHslString;
                }
                break;
        }
    }

    heatingGradientStringify(roomTempHslString, middleHSLString, heatingTempHSLString) {
        return `linear-gradient(180deg, ${middleHSLString} 0%, ${roomTempHslString} 20%, ${roomTempHslString} 95%, ${heatingTempHSLString} 100%)`;
    }

    hslStringify(hsl) {
        return `hsl(${hsl.hue}, ${hsl.sat}%, ${hsl.lum}%)`;
    }

    colorSky({ temperature, sunAngle, cloudiness, rainIntensity, hasFog, visibility, humidity }) {
        // Retrieve elements from DOM
        const sky = document.querySelector('#sky');
        const fog = document.querySelector('#fog');

        // Constants
        const MIN_FOG_BRIGHTNESS = 0.3, MAX_FOG_BRIGHTNESS = 1.45;
        const MIN_GRAYSCALE = -0.5, MAX_GRAYSCALE = -1;
        const DAYTIME_LUM_MAX = 80, DAYTIME_LUM = 50, NIGHTIME_LUM = 15;

        // Set stars if nightime
        this.drawStars(sunAngle);

        // Color sky and clouds
        const { hue, sat, lum } = this.colorTemperature.colorT(temperature, sunAngle, 0, rainIntensity);

        let upperLuminosity = Math.min(Math.max(this.utils.transition(NIGHTIME_LUM, DAYTIME_LUM, -10, 0, sunAngle), NIGHTIME_LUM), DAYTIME_LUM);
        let lowerLuminosity = Math.min(Math.max(this.utils.transition(NIGHTIME_LUM, DAYTIME_LUM_MAX, -12, 0, sunAngle), NIGHTIME_LUM), DAYTIME_LUM_MAX);
        
        // TODO: Saturation on low sun angles

        const upperHsl = `hsl(${hue}, ${sat}%, ${upperLuminosity}%)`;
        const lowerHsl = `hsl(${hue}, ${sat}%, ${lowerLuminosity}%)`;

        let brightness = 0;

        if (sunAngle >= 0) {
            brightness = MAX_FOG_BRIGHTNESS;
        } else if (sunAngle <= -12) {
            brightness = MIN_FOG_BRIGHTNESS;
        } else {
            brightness = this.utils.transition(MIN_FOG_BRIGHTNESS, MAX_FOG_BRIGHTNESS, -12, 0, sunAngle);
        }

        let grayscale = 0;

        if (rainIntensity > 1) {
            grayscale = this.utils.transition(MIN_GRAYSCALE, MAX_GRAYSCALE, 0, 3, Math.pow(rainIntensity, 1 / 2));
        } else {
            grayscale = MIN_GRAYSCALE;
        }

        // Set fog
        if (!hasFog) {
            visibility = 5000;
        } else if (visibility == 0) {
            visibility = 1;
        }

        fog.style.opacity = `${129 - 15.3 * Math.log(visibility)}%`;
        this.setFog(sunAngle, hue);
        
        let skyGradientAngle = sunAngle >= 0? sunAngle * 2 : 0;
        
        sky.style.background = `linear-gradient(-${skyGradientAngle}deg, ${lowerHsl} 0%, ${upperHsl} 50%)`;

        // Set background image
        this.drawClouds(cloudiness, grayscale, hue, sunAngle);
    }

    setFog(sunAngle, temperatureHue) {
        const MIN_FOG_BRIGHTNESS = 0.1, MAX_FOG_BRIGHTNESS = 1.45;
        const MAX_SUN_ANGLE_FOG = 24;
        let brightness = 0;

        if (sunAngle >= MAX_SUN_ANGLE_FOG) {
            brightness = MAX_FOG_BRIGHTNESS;
        } else if (sunAngle <= -12) {
            brightness = MIN_FOG_BRIGHTNESS;
        } else {
            brightness = this.utils.transition(MIN_FOG_BRIGHTNESS, MAX_FOG_BRIGHTNESS, -12, MAX_SUN_ANGLE_FOG, sunAngle);
        }
        fog.style.filter = `brightness(${brightness})`;
        fog.style.backgroundColor = this.hslStringify({hue: temperatureHue, sat: 100, lum: 75});
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
        const MAX_CSS_BRIGHTNESS = 1 + 0.35 * (3 / 7);

        console.log(`Hue: ${hue}`);

        let max_css_brightness = 1 + 0.35 * (3 / 7);
        if (hue > 45 && hue <= 60) {
            max_css_brightness = 1.35;
        } else if (hue > 60 && hue < 120) {
            max_css_brightness = this.utils.transition(1.15, 1.35, 120, 60, hue);
        } else if (hue >= 120) {
            max_css_brightness = 1.15;
        } else {
            // < 45
            max_css_brightness = this.utils.transition(1.35, 1.15, 45, 30, hue);
        }

        let cloudBrightness, cssBrightness;
        if (sunAngle >= 0) {
            cloudBrightness = MAX_CLOUD_BRIGHTNESS;
            cssBrightness = max_css_brightness;
        } else if (sunAngle <= -12) {
            cloudBrightness = MAX_CLOUD_BRIGHTNESS;
            cssBrightness = MIN_CSS_BRIGHTNESS;
        } else {
            cloudBrightness = this.utils.transition(MIN_CLOUD_BRIGHTNESS, MAX_CLOUD_BRIGHTNESS, -12, 0, sunAngle);
            cssBrightness = this.utils.transition(MIN_CSS_BRIGHTNESS, max_css_brightness, -12, 0, sunAngle);
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

            clouds.style.filter = `brightness(${cssBrightness})`;
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

    computeVisibility(humidity, temperature) {
        const tempInF = this.utils.cToF(temperature);
        humidity = humidity / 100;

        return 10000;
    }
}