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
}