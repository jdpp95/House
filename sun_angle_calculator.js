class SunAngleCalculator {
    TO_RADIANS = Math.PI / 180;
    TO_DEGREES = 180 / Math.PI;

    constructor() { }

    getTimeFromSunAngle(sunAngle, location, date) {
        let { latitude, longitude, utc } = location;

        let dayOfYear = this.getDayOfYear(date);
        let declination = this.getDeclination(dayOfYear);
        let hourAngle = this.getHourAngleFromSunAngle(sunAngle, declination, latitude);
        let localStandardTimeMeridian = this.getLocalStandardTimeMeridian(utc);
        let equationOfTime = this.getEquationOfTime(dayOfYear);

        let timeCorrection = this.getTimeCorrection(longitude, localStandardTimeMeridian, equationOfTime);

        let localTime = 12 - timeCorrection / 60;

        return [localTime - hourAngle / 15, localTime + hourAngle / 15];
    }

    getSunAngleFromTime(time, location) {
        const unixDate = Date.parse(time) / 1000;
        return this.getSunAngleFromTimestamp(unixDate, location);
    }

    getSunAngleFromTimestamp(timestamp, location) {
        let { latitude, longitude, utc } = location;
        latitude *= this.TO_RADIANS;

        const date = new Date(timestamp * 1000);
        let dayOfYear = this.getDayOfYear(date);

        let declination = this.getDeclination(dayOfYear) * this.TO_RADIANS;
        let localTime = date.getUTCHours() + utc * 1 + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
        let hourAngle = this.getHourAngleFromLocalTime(longitude, dayOfYear, localTime, utc) * this.TO_RADIANS;

        return Math.asin(Math.sin(declination) * Math.sin(latitude)
            + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle)) * this.TO_DEGREES;
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const day = Math.floor(diff / (1000 * 60 * 60 * 24));
        return day;
    }

    getDeclination(dayOfYear) {
        return -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
    }

    getHourAngleFromLocalTime(longitude, dayOfYear, localTime, utc) {
        let equationOfTime = this.getEquationOfTime(dayOfYear);
        let localStandardTimeMeridian = this.getLocalStandardTimeMeridian(utc);
        let timeCorrection = this.getTimeCorrection(longitude, localStandardTimeMeridian, equationOfTime);
        let localSolarTime = localTime + timeCorrection / 60;

        return 15 * (localSolarTime - 12);
    }

    getHourAngleFromSunAngle(sunAngle, declination, latitude) {
        sunAngle *= this.TO_RADIANS;
        declination *= this.TO_RADIANS;
        latitude *= this.TO_RADIANS;

        return Math.acos((Math.sin(sunAngle) - Math.sin(declination) * Math.sin(latitude)) / (Math.cos(declination) * Math.cos(latitude))) * this.TO_DEGREES;
    }

    getTimeCorrection(longitude, localStandardTimeMeridian, equationOfTime) {
        return 4 * (longitude - localStandardTimeMeridian) + equationOfTime;
    }

    getEquationOfTime(dayOfYear) {
        let b = (2.0 * Math.PI / 365) * (dayOfYear - 81);
        return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    }

    getLocalStandardTimeMeridian(utc) {
        return utc * 15;
    }
}