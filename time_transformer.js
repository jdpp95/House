class TimeTransformer {

    constructor() { }

    updateTime(previousLocalTime = [0, 0]) {
        setTimeout(() => {
            let otherLocalTime = this.getOtherTime();

            let diff1 = otherLocalTime[0] - previousLocalTime[0];
            let diff2 = otherLocalTime[1] - previousLocalTime[1];

            let rate = Math.abs(diff1) * 60 * 60;

            console.log(`Rate: ${rate.toFixed(1)}x`);

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

            this.updateTime(otherLocalTime);
        }, 1000);
    }

    printHourlySunAngles() {

        let hourlySunAngles = [];

        for (let i = 0; i < 24; i++) {

            let millis = otherDate.getTime();
            millis += (i - otherLocation.utc) * 1000 * 60 * 60;

            let date = new Date(millis);
            let sunAngle = sunAngleCalculator.getSunAngleFromTime(date.toISOString(), otherLocation);
            hourlySunAngles.push(sunAngle);

            let position = localStorage.getItem('coords').split(",");
            let currentLocation = { latitude: position[0], longitude: position[1], utc: -5 };
            let otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(sunAngle, currentLocation, new Date());
            console.log(`//     { time: ${i},  temperature: t,  sunAngle: ${sunAngle.toFixed(1)}},    clouds: c}, // ${this.formatLocalTime(otherLocalTime)}`);
        }
    }

    formatLocalTime(localTime) {
        let localTimeArr = localTime.map((rawLocalTime) => {
            let hour = Math.floor(rawLocalTime);
            let percentage = Math.round((rawLocalTime - hour) * 100);
            return `${hour}h ${percentage}%`;
        });

        return localTimeArr.join('-');
    }

    getOtherTime() {
        let position = localStorage.getItem('coords').split(',');
        let currentLocation = { latitude: position[0], longitude: position[1], utc: -5 };
        let currentSunAngle = sunAngleCalculator.getSunAngleFromTime(new Date(), currentLocation);
        let otherLocalTime = sunAngleCalculator.getTimeFromSunAngle(currentSunAngle, otherLocation, otherDate);

        return otherLocalTime;
    }

    getCurrentLocation(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(callback, (e) => console.error(e));
        } else {
            console.error("Geolocation is not supported by this browser.")
        }
    }

}