"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCartesianPositions = exports.getCartesianPosition = exports.saveCartesianPosition = exports.getCounterCritical = exports.resetCounterCritical = exports.decrementCounterCritical = exports.incrementCounterCritical = exports.getCounter = exports.resetCounter = exports.decrementCounter = exports.incrementCounter = void 0;
let globalMediumOccurrenceCounter = 0;
let globalCriticalOccurrenceCounter = 0;
let savedRange;
function incrementCounter() {
    globalMediumOccurrenceCounter++;
}
exports.incrementCounter = incrementCounter;
function decrementCounter() {
    globalMediumOccurrenceCounter--;
}
exports.decrementCounter = decrementCounter;
function resetCounter() {
    globalMediumOccurrenceCounter = 0;
}
exports.resetCounter = resetCounter;
function getCounter() {
    return globalMediumOccurrenceCounter;
}
exports.getCounter = getCounter;
function incrementCounterCritical() {
    globalCriticalOccurrenceCounter++;
}
exports.incrementCounterCritical = incrementCounterCritical;
function decrementCounterCritical() {
    globalCriticalOccurrenceCounter--;
}
exports.decrementCounterCritical = decrementCounterCritical;
function resetCounterCritical() {
    globalCriticalOccurrenceCounter = 0;
}
exports.resetCounterCritical = resetCounterCritical;
function getCounterCritical() {
    return globalCriticalOccurrenceCounter;
}
exports.getCounterCritical = getCounterCritical;
let savedRanges = []; // List to store ranges
function saveCartesianPosition(range) {
    savedRanges.push(range); // Add the new range to the list
}
exports.saveCartesianPosition = saveCartesianPosition;
function getCartesianPosition() {
    return savedRanges; // Return the list of ranges
}
exports.getCartesianPosition = getCartesianPosition;
// Optional: Function to clear the saved ranges
function clearCartesianPositions() {
    savedRanges = [];
}
exports.clearCartesianPositions = clearCartesianPositions;
//# sourceMappingURL=counter.js.map