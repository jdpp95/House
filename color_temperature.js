class ColorTemperature {
    constructor() {}

    colorT(t, sunAngle, clouds, rainIntensity = 0) {
        const utils = new Utils();

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
            lum = utils.transition(MAX_LUM, MIN_LUM, 0, -12, sunAngle)
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

            hue = utils.transition(colors[index][1], colors[index + 1][1], colors[index][0], colors[index + 1][0], t);
        }

        sat = Math.round(sat);
        hue = Math.round(hue);
        lum = Math.round(lum);

        return { hue, sat, lum };
    }

    weatherToString(temperature, cloudiness) {
        let weatherConditions = "";

        if(cloudiness >= 0 && cloudiness <= 0.125){
            weatherConditions = "Clear";
        } else if (cloudiness >= 0.125 && cloudiness <= 0.375) {
            weatherConditions = "Fair";
        } else if (cloudiness >= 0.375 && cloudiness <= 0.5) {
            weatherConditions = "Partly clear";
        } else if (cloudiness >= 0.5 && cloudiness <= 0.625) {
            weatherConditions = "Partly cloudy";
        } else if (cloudiness >= 0.625 && cloudiness <= 0.9) {
            weatherConditions = "Mostly cloudy";
        } else if (cloudiness >= 0.9 && cloudiness <= 1) {
            weatherConditions = "Overcast";
        } else if (temperature > 2) {
            if(cloudiness > 1 && cloudiness <= 1.3) {
                weatherConditions = "Drizzle";
            } else if (cloudiness > 1.3 && cloudiness <= 1.6) {
                weatherConditions = "Rain";
            } else if (cloudiness > 1.6 && cloudiness <= 2) {
                weatherConditions = "Heavy rain";
            }
        } else if (temperature < 1) {
            if(cloudiness > 1 && cloudiness <= 1.3) {
                weatherConditions = "Light snow";
            } else if (cloudiness > 1.3 && cloudiness <= 1.6) {
                weatherConditions = "Snow";
            } else if (cloudiness > 1.6 && cloudiness <= 2) {
                weatherConditions = "Blizzard";
            }
        } else {
            if(cloudiness > 1 && cloudiness <= 1.3) {
                weatherConditions = "Light sleet";
            } else if (cloudiness > 1.3 && cloudiness <= 1.6) {
                weatherConditions = "Sleet";
            } else if (cloudiness > 1.6 && cloudiness <= 2) {
                weatherConditions = "Heavy sleet";
            }
        }

        return weatherConditions;
    }
}