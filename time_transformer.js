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
            let angleOverflow = 0;

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

            if (isNaN(otherLocalTime[0])) {
                let maxSunAngle = Number(sunAngle.toFixed(4));
                while (isNaN(otherLocalTime[0])) {
                    if (maxSunAngle > 0) {
                        maxSunAngle -= 0.0001;
                    } else {
                        maxSunAngle += 0.0001;
                    }
                    otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(maxSunAngle, currentLocation, new Date());
                }
            }

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
                otherLocalTime,
                angleOverflow
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

        let previousTemperature, greatestDiff = Number.NEGATIVE_INFINITY;

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

                transformedItemChunk = this.transformWeatherItem(rawHourlyWeather, otherLocalTime1, percentage, transformedItem.angleOverflow);
            } else {
                // Blending
                let percentage1 = otherLocalTimeArr[0] % 1;
                let percentage2 = otherLocalTimeArr[1] % 1;

                // If the second item refers to the previous day, represent this previous day properly
                if (otherLocalTimeArr[1] && h < 6) {
                    otherLocalTimeArr[1] -= 24;
                }

                let transformedItem1 = this.transformWeatherItem(rawHourlyWeather, otherLocalTimeArr[0], percentage1, transformedItem.angleOverflow);
                let transformedItem2 = this.transformWeatherItem(rawHourlyWeather, otherLocalTimeArr[1], percentage2, transformedItem.angleOverflow);

                transformedItemChunk = {
                    temperature: (transformedItem1.temperature + transformedItem2.temperature) / 2,
                    cloudiness: (transformedItem1.cloudiness + transformedItem2.cloudiness) / 2,
                    humidity: (transformedItem1.humidity + transformedItem2.humidity) / 2
                };
            }

            if (!transformedItemChunk || transformedItemChunk.temperature === undefined || isNaN(transformedItemChunk.temperature)) {
                continue;
            }

            let hourlyTemperatureDiff = transformedItem.temperature - previousTemperature;
            let earlyMorningMaxDrop = 2 - transformedItemChunk.cloudiness;

            if (h < 6 && !isNaN(hourlyTemperatureDiff) && hourlyTemperatureDiff < 0) {
                const temperatureDrop = Math.min(-hourlyTemperatureDiff, earlyMorningMaxDrop);
                transformedItem.temperature = previousTemperature - temperatureDrop;
            } else {
                transformedItem.temperature = transformedItemChunk.temperature;
            }

            transformedItem.clouds = transformedItemChunk.cloudiness;
            transformedItem.humidity = transformedItemChunk.humidity;

            if (greatestDiff < hourlyTemperatureDiff) {
                if (h <= 11) {
                    greatestDiff = hourlyTemperatureDiff;
                } else {
                    transformedItem.temperature = previousTemperature + greatestDiff;
                }
            }

            previousTemperature = transformedItem.temperature;

            // Compute indoor temperature
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

            transformedItem.hasHeating = false;

            const thermostatConfig = {
                9: {
                    floor1: {
                        temperature: 21,
                    },
                    floor3: {
                        temperature: 20,
                    }
                }
            };

            // Heating
            if (heatingIsOn) {

                if (transformedItem.floor1 < HEATING_MIN) {
                    transformedItem.floor1 = (HEATING_MAX + transformedItem.floor1) / 2;
                    transformedItem.hasHeating = true;
                }

                if (transformedItem.floor3 < HEATING_MIN) {
                    transformedItem.floor3 = (HEATING_MAX + transformedItem.floor3) / 2;
                    transformedItem.hasHeating = true;
                }
                if (transformedItem.floor1 > AC_MAX) {
                    transformedItem.floor1 = (AC_MIN + transformedItem.floor1) / 2;
                    transformedItem.hasHeating = true;
                }

                if (transformedItem.floor3 > AC_MAX) {
                    transformedItem.floor3 = (AC_MIN + transformedItem.floor3) / 2;
                    transformedItem.hasHeating = true;
                }
            }
            weatherJSON.push(transformedItem);
        }

        return weatherJSON;
    }

    transformWeatherItem(rawHourlyWeather, otherLocalTime, percentage, angleOverflow) {
        const utils = new Utils();

        const earlierHour = Math.floor(otherLocalTime);
        const laterHour = Math.ceil(otherLocalTime);

        let earlierRawItem = rawHourlyWeather[earlierHour];
        let laterRawItem = rawHourlyWeather[laterHour];

        // If the raw item is not available skip it and carry on
        if (!earlierRawItem || !laterRawItem) {
            if (!earlierRawItem) {
                console.warn(`${earlierHour}h is needed for ${otherLocalTime}`);
            } else if (!laterRawItem) {
                console.warn(`${laterHour}h is needed for ${otherLocalTime}`);
            }
            return { temperature: undefined, cloudiness: undefined }
        }

        const temp1 = earlierRawItem.temperature;
        const temp2 = laterRawItem.temperature;
        const clouds1 = earlierRawItem.clouds;
        const clouds2 = laterRawItem.clouds;
        let temperature = utils.transition(temp1, temp2, 0, 1, percentage);
        const cloudiness = utils.transition(clouds1, clouds2, 0, 1, percentage);
        const humidity = utils.transition(humidity1, humidity2, 0, 1, percentage);

        if (angleOverflow) {
            temperature += angleOverflow * 0.1;
        }

        const transformedItemChunk = { temperature, cloudiness, humidity };

        return transformedItemChunk;
    }

    applyThermostat(transformedItem, heatingConfig, floor, hour) {
        const HEATING_MIN = 15;
        const HEATING_MAX = 24;
        const AC_MIN = 15;
        const AC_MAX = 22;

        const floorThermostatConfig = heatingConfig[hour]?.[floor];
        const thermostatEnabled = !!floorThermostatConfig;
        const manualThermostatTemperature = floorThermostatConfig?.temperature;
        const auto = isNaN(manualThermostatTemperature);

        if (thermostatEnabled) {
            transformedItem.hasHeating = true;

            if (auto) {
                if (transformedItem[floor] < HEATING_MIN) {
                    // Heat
                    transformedItem[floor] = (HEATING_MAX + transformedItem[floor]) / 2;
                } else if (transformedItem[floor] > AC_MAX) {
                    // Cool
                    transformedItem[floor] = (AC_MIN + transformedItem[floor]) / 2;
                }
            } else {
                // Manual heating
                transformedItem[floor] = manualThermostatTemperature;
            }
        }
    }
}