"use strict";

const interpret = require("./src/interpreter.js");
const {
  D2CalcError,
  D2CalcInternalError,
  D2FError,
  D2FInterpreterError,
  D2FSyntaxError,
} = require("./src/errors.js");

module.exports = interpret;
module.exports.D2CalcError = D2CalcError;
module.exports.D2CalcInternalError = D2CalcInternalError;
module.exports.D2FError = D2FError;
module.exports.D2FInterpreterError = D2FInterpreterError;
module.exports.D2FSyntaxError = D2FSyntaxError;
