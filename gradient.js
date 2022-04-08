class Gradient {
    constructor() {
        let colors = [
            // { time: 0, temperature: -7, sunAngle: -18.2, clouds: 0.73 }, // 4h 92%-19h 32%
            // { time: 1, temperature: -7, sunAngle: -19.1, clouds: 0.75 }, // 4h 86%-19h 38%
            // { time: 2, temperature: -7, sunAngle: -17.5, clouds: 0.75 }, // 4h 97%-19h 27%
            // { time: 3, temperature: -7, sunAngle: -13.5, clouds: 0.75 }, // 5h 24%-19h 1%
            // { time: 4, temperature: -7, sunAngle: -7.5, clouds: 0.60 }, // 5h 64%-18h 60%
            // { time: 5, temperature: -6.6, sunAngle: 0.0, clouds: 0.50 }, // 6h 15%-18h 10%
            // { time: 6, temperature: -6.1, sunAngle: 8.7, clouds: 0.50 }, // 6h 73%-17h 51%
            // { time: 7, temperature: -5.9, sunAngle: 18.2, clouds: 0.69 }, // 7h 37%-16h 88%
            // { time: 8, temperature: -7, sunAngle: 28.2, clouds: 0.75 }, // 8h 4%-16h 21%
            // { time: 9, temperature: -6.8, sunAngle: 38.3, clouds: 0.8 }, // 8h 72%-15h 52%
            // { time: 10, temperature: -6.3, sunAngle: 48.1, clouds: 0.93 }, // 9h 39%-14h 86%
            // { time: 11, temperature: -5.8, sunAngle: 56.9, clouds: 1 }, // 9h 99%-14h 25%
            // { time: 12, temperature: -5.5, sunAngle: 63.4, clouds: 1 }, // 10h 45%-13h 80%
            // { time: 13, temperature: -4.5, sunAngle: 65.5, clouds: 0.6 }, // 10h 59%-13h 65%
            // { time: 14, temperature: -3.5, sunAngle: 62.0, clouds: 0.8 }, // 10h 35%-13h 90%
            // { time: 15, temperature: -2.5, sunAngle: 54.7, clouds: 0.65 }, // 9h 84%-14h 40%
            // { time: 16, temperature: -2.5, sunAngle: 45.5, clouds: 0.5 }, // 9h 21%-15h 3%
            // { time: 17, temperature: -2.2, sunAngle: 35.6, clouds: 0.3 }, // 8h 54%-15h 71%
            // { time: 18, temperature: -3.9, sunAngle: 25.5, clouds: 0.5 }, // 7h 86%-16h 39%
            // { time: 19, temperature: -, sunAngle: 15.6,  clouds: c }, // 7h 19%-17h 5%
            // { time: 20, temperature: -, sunAngle: 6.3,   clouds: c }, // 6h 57%-17h 68%
            // { time: 21, temperature: -, sunAngle: -2.1,  clouds: c }, // 6h 0%-18h 24%
            // { time: 22, temperature: -, sunAngle: -9.3,  clouds: c }, // 5h 52%-18h 72%
            // { time: 23, temperature: -, sunAngle: -14.8, clouds: c }, // 5h 15%-19h 9%
        ];

        this.setGradientColors(colors);
    }

    setGradientColors(weatherData) {
        let tempGradient = document.getElementById("gradient");
        let style = "";
        let houseRenderer = new HouseRenderer();

        if (weatherData.length == 1) {
            let { hue, sat, lum } = houseRenderer.colorT(weatherData[0]['temperature'], weatherData[0]['sunAngle'], weatherData[0]['clouds'], weatherData[0]['rain']);
            let hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;
            style = hsl;
        } else {

            style = "linear-gradient(180deg, ";

            for (let i = 0; i < 24; i++) {
                let hourlyWeather = weatherData[i];

                let position = Math.round(100 * i / 24);

                if (weatherData[i]) {
                    let { hue, sat, lum } = houseRenderer.colorT(hourlyWeather.temperature, hourlyWeather.sunAngle, hourlyWeather.clouds, hourlyWeather.rain);
                    let hsl = `hsl(${hue}, ${sat}%, ${lum}%)`;
                    style += `${hsl} ${position}%, `;
                }

                if (hourlyWeather) {
                    console.log(`${hourlyWeather.time}:00 ${(hourlyWeather.temperature * 1.8 + 32).toFixed(0)} \u00B0F`);
                }

                if (i == 23) {
                    style = style.substring(0, style.length - 2) + ")";
                }
            }
        }

        const last = weatherData[weatherData.length - 1];
        console.log(houseRenderer.colorT(last.temperature, last.sunAngle, last.clouds, last.rain));

        console.log(style)
        tempGradient.style.background = style;
    }
}