class Gradient {

    timeTransformer;
    gradientData;
    GRADIENT_TIME = 16;

    // Min: - °C
    // Max: - °C

    constructor(timeTransformer) {
        this.timeTransformer = timeTransformer;

        let rawHourlyWeather = {
            indoorTemp: { floor1: 14.5, floor3: 18 },
            // 19: {   temperature: -, clouds: c },
            // 20: {   temperature: -, clouds: c },
            // 21: {   temperature: -, clouds: c },
            // 22: {   temperature: -, clouds: c },
            // 23: {   temperature: -, clouds: c },
        };

        let transformedHourlyWeather = timeTransformer.transformWeatherJSON(rawHourlyWeather);
        console.table(transformedHourlyWeather);

        this.setGradientColors(transformedHourlyWeather);

        // "-5" { temperature: t,  clouds: c, humidity: h },
        // "-4" { temperature: t,  clouds: c, humidity: h },
        // "-3" { temperature: t,  clouds: c, humidity: h },
        // "-2" { temperature: t,  clouds: c, humidity: h },
        // "-1" { temperature: t,  clouds: c, humidity: h },
        // 0:   { temperature: t,  clouds: c, humidity: h },
        // 1:   { temperature: t,  clouds: c, humidity: h },
        // 2:   { temperature: t,  clouds: c, humidity: h },
        // 3:   { temperature: t,  clouds: c, humidity: h },
        // 4:   { temperature: t,  clouds: c, humidity: h },
        // 5:   { temperature: t,  clouds: c, humidity: h },
        // 6:   { temperature: t,  clouds: c, humidity: h },
        // 7:   { temperature: t,  clouds: c, humidity: h },
        // 8:   { temperature: t,  clouds: c, humidity: h },
        // 9:   { temperature: t,  clouds: c, humidity: h },
        // 10:  { temperature: t,  clouds: c, humidity: h },
        // 11:  { temperature: t,  clouds: c, humidity: h },
        // 12:  { temperature: t,  clouds: c, humidity: h },
        // 13:  { temperature: t,  clouds: c, humidity: h },
        // 14:  { temperature: t,  clouds: c, humidity: h },
        // 15:  { temperature: t,  clouds: c, humidity: h },
        // 16:  { temperature: t,  clouds: c, humidity: h },
        // 17:  { temperature: t,  clouds: c, humidity: h },
        // 18:  { temperature: t,  clouds: c, humidity: h },
        // 19:  { temperature: t,  clouds: c, humidity: h },
        // 20:  { temperature: t,  clouds: c, humidity: h },
        // 21:  { temperature: t,  clouds: c, humidity: h },
        // 22:  { temperature: t,  clouds: c, humidity: h },
        // 23:  { temperature: t,  clouds: c, humidity: h },
    }

    setGradientColors(weatherData) {
        let tempGradient = document.getElementById("gradient");
        let gradientTextElement = document.getElementById("gradient-text");
        let style = "";
        let colorTemperature = new ColorTemperature();

        this.gradientData = weatherData = weatherData.filter((item) => item.time <= this.GRADIENT_TIME);

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

        if (itemAt18) {
            console.log(colorTemperature.colorT(itemAt18.temperature, itemAt18.sunAngle, itemAt18.clouds, itemAt18.rain));
        }

        if (last) {
            let gradientText = "";
            gradientText += `${last.time}:00 ${(last.temperature * 1.8 + 32).toFixed(0)} °F \n`;
            gradientText += colorTemperature.weatherToString(last.temperature, last.clouds);

            if (this.GRADIENT_TIME < 24) {
                gradientTextElement.innerText = gradientText;
            }
        }

        tempGradient.style.background = style;
    }

    getGradientData() {
        return this.gradientData;
    }
}