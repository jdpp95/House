class Gradient {

    timeTransformer;
    GRADIENT_TIME = 0;

    constructor(timeTransformer) {
        this.timeTransformer = timeTransformer;

        let rawHourlyWeather = [
            { time: "-3", temperature: -1, clouds: 1 },
            { time: "-2", temperature: -1, clouds: 1 },
            { time: 0, temperature: -2, clouds: 0.75 },
            { time: 1, temperature: -3, clouds: 1.25 },
            { time: 2, temperature: -3, clouds: 1 },
            { time: 3, temperature: -3, clouds: 1.25 },
            { time: 4, temperature: -4, clouds: 0.75 },
            { time: 5, temperature: -4, clouds: 0.85 },
            { time: 6, temperature: -4, clouds: 0.85 },
            { time: 7, temperature: -3, clouds: 0.85 },
            { time: 8, temperature: -2, clouds: 0.85 },
            { time: 9, temperature: -2, clouds: 0.85 },
            { time: 10, temperature: 1, clouds: 0.85 },
            { time: 11, temperature: 0, clouds: 0.85 },
            { time: 12, temperature: 2, clouds: 0.85 },
            { time: 16, temperature: -2.1, clouds: 1.1 },
            { time: 17, temperature: -4.7, clouds: 1 },
            // { time: 18,   temperature: -, clouds: 0.9 },
            // { time: 19,   temperature: -, clouds: c },
            // { time: 20,   temperature: -, clouds: c },
            // { time: 21,   temperature: -, clouds: c },
            // { time: 22,   temperature: -, clouds: c },
            // { time: 23,   temperature: -, clouds: c },
        ];

        let transformedHourlyWeather = timeTransformer.transformWeatherJSON(rawHourlyWeather);
        console.log(transformedHourlyWeather);




        this.setGradientColors(transformedHourlyWeather);

        // { time: "-", temperature: t,  clouds: c },
        // { time: "-", temperature: t,  clouds: c },
        // { time: 0,    temperature: t,  clouds: c },
        // { time: 1,    temperature: t,  clouds: c },
        // { time: 2,    temperature: t,  clouds: c },
        // { time: 3,    temperature: t,  clouds: c },
        // { time: 4,    temperature: t,  clouds: c },
        // { time: 5,    temperature: t,  clouds: c },
        // { time: 6,    temperature: t,  clouds: c },
        // { time: 7,    temperature: t,  clouds: c },
        // { time: 8,    temperature: t,  clouds: c },
        // { time: 9,    temperature: t,  clouds: c },
        // { time: 10,   temperature: t,  clouds: c },
        // { time: 11,   temperature: t,  clouds: c },
        // { time: 12,   temperature: t,  clouds: c },
        // { time: 13,   temperature: t,  clouds: c },
        // { time: 14,   temperature: t,  clouds: c },
        // { time: 15,   temperature: t,  clouds: c },
        // { time: 16,   temperature: t,  clouds: c },
        // { time: 17,   temperature: t,  clouds: c },
        // { time: 18,   temperature: t,  clouds: c },
        // { time: 19,   temperature: t,  clouds: c },
        // { time: 20,   temperature: t,  clouds: c },
        // { time: 21,   temperature: t,  clouds: c },
        // { time: 22,   temperature: t,  clouds: c },
        // { time: 23,   temperature: t,  clouds: c },
    }

    setGradientColors(weatherData) {
        let tempGradient = document.getElementById("gradient");
        let gradientTextElement = document.getElementById("gradient-text");
        let style = "";
        let colorTemperature = new ColorTemperature();

        weatherData = weatherData.filter((item) => item.time <= this.GRADIENT_TIME);

        if (weatherData.length == 1) {
            let { hue, sat, lum } = colorTemperature.colorT(weatherData[0]['temperature'], weatherData[0]['sunAngle'], weatherData[0]['clouds'], weatherData[0]['rain']);
            let hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;
            style = hsl;
        } else {

            style = "linear-gradient(180deg, ";

            for (let i = 0; i < 24; i++) {

                let hourlyWeather = weatherData[i];

                let position = Math.round(100 * i / 24);

                if (weatherData[i]) {
                    let { hue, sat, lum } = colorTemperature.colorT(hourlyWeather.temperature, hourlyWeather.sunAngle, hourlyWeather.clouds, hourlyWeather.rain);
                    let hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;
                    style += `${hsl} ${position}%, `;
                }

                if (i == 23) {
                    style = style.substring(0, style.length - 2) + ")";
                }
            }
        }

        let index = weatherData.length - 1;

        const itemAt18 = weatherData[18];
        const last = weatherData[index];

        if(itemAt18) {
            console.log(colorTemperature.colorT(itemAt18.temperature, itemAt18.sunAngle, itemAt18.clouds, itemAt18.rain));
        }

        if (last) {
            let gradientText = "";
            gradientText += `${last.time}:00 ${(last.temperature * 1.8 + 32).toFixed(0)} °F \n`;
            gradientText += colorTemperature.weatherToString(last.temperature, last.clouds);

            if(this.GRADIENT_TIME < 24){
                gradientTextElement.innerText = gradientText;
            }
        }

        tempGradient.style.background = style;
    }
}