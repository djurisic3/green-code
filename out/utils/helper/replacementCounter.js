"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCounter = exports.resetCounter = exports.decrementCounter = exports.incrementCounter = void 0;
let globalReplacementCounter = 0;
function incrementCounter() {
    globalReplacementCounter++;
}
exports.incrementCounter = incrementCounter;
function decrementCounter() {
    globalReplacementCounter--;
}
exports.decrementCounter = decrementCounter;
function resetCounter() {
    globalReplacementCounter = 0;
}
exports.resetCounter = resetCounter;
function getCounter() {
    return globalReplacementCounter;
}
exports.getCounter = getCounter;
//# sourceMappingURL=replacementCounter.js.map