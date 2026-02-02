class Utils {
    constructor() { }

    transition(targetStart, targetEnd, originStart, originEnd, originalValue) {
        let ratio = (originalValue - originStart) / (originEnd - originStart);
        return targetStart + (targetEnd - targetStart) * ratio;
    }

    cToF(tempInC) {
        return (tempInC * 9 / 5) + 32;
    }

    computeVisibility(humidity, cloudiness) {
        let humidityFactor = 12 - humidity * 10;

        if (cloudiness > 0.9) {
            const cloudinessFactor = cloudiness * 10 - 9;
            humidityFactor -= cloudinessFactor;
        }

        return Math.min(10 ** humidityFactor, 5000);
    }
}