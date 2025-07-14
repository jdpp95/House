class Utils {
    constructor() { }

    transition(targetStart, targetEnd, originStart, originEnd, originalValue) {
        let ratio = (originalValue - originStart) / (originEnd - originStart);
        return targetStart + (targetEnd - targetStart) * ratio;
    }
}