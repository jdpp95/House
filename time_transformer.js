class TimeTransformer {

    otherDate;
    otherLocation;

    constructor() { }

    setDate(date) {
        this.otherDate = date;
        localStorage.setItem('otherDate', date.toISOString());
    }

    updateTime(locationData, previousLocalTime = [0, 0]) {
        this.otherLocation = locationData;
        setTimeout(() => {
            let otherLocalTime = this.getOtherTime();

            let diff1 = otherLocalTime[0] - previousLocalTime[0];
            let diff2 = otherLocalTime[1] - previousLocalTime[1];

            let rate = Math.abs(diff1) * 60 * 60;

            // console.log(`Rate: ${rate.toFixed(1)}x`);

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

            this.updateTime(locationData, otherLocalTime);
        }, 1000);
    }

    computeHourlySunAngles() {
        let { utc, coords } = JSON.parse(localStorage.getItem('locationData'));
        let [latitude, longitude] = coords.split(",");
        this.otherLocation = { utc, latitude, longitude };

        let hourlySunAngles = [];
        let previousState, isMorning;

        for (let i = 0; i < 24; i++) {

            let millis = otherDate.getTime();
            millis += (i - this.otherLocation.utc) * 1000 * 60 * 60;

            let date = new Date(millis);
            let datePlus1Minute = new Date(millis + 1000 * 60);

            let sunAngle = sunAngleCalculator.getSunAngleFromTime(date.toISOString(), this.otherLocation);
            let sunAngllePlus1Minute = sunAngleCalculator.getSunAngleFromTime(datePlus1Minute.toISOString(), this.otherLocation);

            previousState = isMorning;
            isMorning = sunAngle < sunAngllePlus1Minute;

            let itsNoonOrMidnight = (previousState !== isMorning && previousState !== undefined) || (previousState === undefined && isMorning);

            let position = localStorage.getItem('coords').split(",");
            let currentLocation = { latitude: position[0], longitude: position[1], utc: -5 };
            let otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(sunAngle, currentLocation, new Date());

            if (!itsNoonOrMidnight) { //TODO: Try with ternary operator
                if (isMorning) {
                    otherLocalTime = otherLocalTime.slice(0, 1);
                } else {
                    otherLocalTime = otherLocalTime.slice(1);
                }
            }

            let hourlySunAngleItem = {
                time: i,
                sunAngle,
                otherLocalTime
            };

            hourlySunAngles.push(hourlySunAngleItem);
        }

        return hourlySunAngles;
    }

    printHourlySunAngles() {
        let hourlySunAngles = this.computeHourlySunAngles();

        for (let i = 0; i < hourlySunAngles.length; i++) {
            let hourlySunAngleItem = hourlySunAngles[i];
            console.log(`//     { time: ${hourlySunAngleItem.time},  temperature: t,  sunAngle: ${hourlySunAngleItem.sunAngle.toFixed(1)},    clouds: c}, // ${this.formatLocalTime(hourlySunAngleItem.otherLocalTime)}`);
        }
    }

    formatLocalTime(localTime) {
        //
        let localTimeArr = localTime.map((rawLocalTime) => {
            let hour = Math.floor(rawLocalTime);
            let percentage = Math.round((rawLocalTime - hour) * 100);
            return `${hour}h ${percentage}%`;
        });

        return localTimeArr.join('-');
    }

    getOtherTime() {
        let position = localStorage.getItem('coords')?.split(',');
        let currentLocation = { latitude: position[0], longitude: position[1], utc: -5 };
        let currentSunAngle = sunAngleCalculator.getSunAngleFromTime(new Date(), currentLocation);
        let otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(currentSunAngle, this.otherLocation, otherDate);

        return otherLocalTime;
    }

    getCurrentLocation(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(callback, (e) => console.error(e));
        } else {
            console.error("Geolocation is not supported by this browser.")
        }
    }

    transformWeatherJSON(rawHourlyWeather) {
        let transformedHourlyAngles = this.computeHourlySunAngles();
        let weatherJSON = [];

        for (let h = 0; h < transformedHourlyAngles.length; h++) {
            let transformedItem = transformedHourlyAngles[h];
            let previousTransformedItem = weatherJSON[h - 1];

            let otherLocalTimeArr = transformedItem.otherLocalTime;
            let otherLocalTime1;
            let transformedItemChunk;

            let needToBlend = otherLocalTimeArr.length !== 1;
            if (!needToBlend) {
                otherLocalTime1 = otherLocalTimeArr[0];
                let percentage = otherLocalTime1 % 1;

                // If transformed time refers to the previous day represent this previous day properly
                if (otherLocalTime1 > 12 && h < 6) {
                    otherLocalTime1 -= 24;
                }

                transformedItemChunk = this.transformWeatherItem(rawHourlyWeather, otherLocalTime1, percentage);
            } else {
                let percentage1 = otherLocalTimeArr[0] % 1;
                let percentage2 = otherLocalTimeArr[1] % 1;

                // If the second item refers to the previous day, represent this previous day properly
                if (otherLocalTimeArr[1] && h < 6) {
                    otherLocalTimeArr[1] -= 24;
                }

                let transformedItem1 = this.transformWeatherItem(rawHourlyWeather, otherLocalTimeArr[0], percentage1);
                let transformedItem2 = this.transformWeatherItem(rawHourlyWeather, otherLocalTimeArr[1], percentage2);

                transformedItemChunk = {
                    temperature: (transformedItem1.temperature + transformedItem2.temperature) / 2,
                    cloudiness: (transformedItem1.cloudiness + transformedItem2.cloudiness) / 2
                };
            }

            if (!transformedItemChunk || transformedItemChunk.temperature === undefined || isNaN(transformedItemChunk.temperature)) {
                continue;
            }

            transformedItem.temperature = transformedItemChunk.temperature;
            transformedItem.clouds = transformedItemChunk.cloudiness;


            if (previousTransformedItem) {
                let computeIndoorTempDelta = (currentOutdoorTemperature, previousIndoorTemperature, kPlus, kMinus) => {
                    return currentOutdoorTemperature + (previousIndoorTemperature - currentOutdoorTemperature) * Math.exp(currentOutdoorTemperature - previousIndoorTemperature < 0 ? -kPlus : -kMinus);
                }

                transformedItem.floor1 = computeIndoorTempDelta(transformedItem.temperature, previousTransformedItem.floor1, 0.07, 0.45); //1st floor
                transformedItem.floor3 = computeIndoorTempDelta(transformedItem.temperature, previousTransformedItem.floor3, 0.015, 0.15); //3rd floor
            } else {
                transformedItem.floor1 = rawHourlyWeather.indoorTemp.floor1;
                transformedItem.floor3 = rawHourlyWeather.indoorTemp.floor3;
            }


            weatherJSON.push(transformedItem);
        }

        return weatherJSON;
    }

    transformWeatherItem(rawHourlyWeather, otherLocalTime, percentage) {
        let utils = new Utils();

        let earlierHour = Math.floor(otherLocalTime);
        let laterHour = Math.ceil(otherLocalTime);

        // TODO: Add case when otherSunAngle is greater than currentSunAngle and
        // above values are NaN

        let earlierRawItem = rawHourlyWeather[earlierHour];
        let laterRawItem = rawHourlyWeather[laterHour];

        // If the raw item is not available skip it and carry on
        if (!earlierRawItem || !laterRawItem) {
            if (earlierHour < 0) {
                console.warn(`${earlierHour}h is needed`);
            } else if (laterHour < 0) {
                console.warn(`${laterHour}h is needed`);
            }
            return { temperature: undefined, cloudiness: undefined }
        }

        let temp1 = earlierRawItem.temperature;
        let temp2 = laterRawItem.temperature;
        let clouds1 = earlierRawItem.clouds;
        let clouds2 = laterRawItem.clouds;
        let temperature = utils.transition(temp1, temp2, 0, 1, percentage);
        let cloudiness = utils.transition(clouds1, clouds2, 0, 1, percentage);

        let transformedItemChunk = { temperature, cloudiness };

        return transformedItemChunk;
    }
}