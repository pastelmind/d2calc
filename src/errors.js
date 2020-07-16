"use strict";

/**
 * Base class for all exceptions thrown by this package.
 * The exception hierarchy is as follows:
 *
 *  - D2CalcError
 *    - D2FError
 *      - D2FSyntaxError
 *      - D2FInterpreterError
 *    - D2CalcInternalError
 *
 * To handle exceptions caused by invalid D2F code, catch `D2FError` instead.
 *
 * To handle exceptions caused by incorrect interpreter configuration, catch
 * `D2CalcInternalError` instead.
 */
class D2CalcError extends Error {}
D2CalcError.prototype.name = D2CalcError.name;

/**
 * Base class for internal exceptions (unrelated to D2F code).
 */
class D2CalcInternalError extends D2CalcError {}
D2CalcInternalError.prototype.name = D2CalcInternalError.name;

/**
 * Base class for exceptions caused by invalid D2F code.
 */
class D2FError extends D2CalcError {}
D2FError.prototype.name = D2FError.name;

/**
 * Represents a syntax error in D2F code.
 */
class D2FSyntaxError extends D2FError {}
D2FSyntaxError.prototype.name = D2FSyntaxError.name;

/**
 * Represents a logical error caused while interpreting D2F code.
 */
class D2FInterpreterError extends D2FError {}
D2FInterpreterError.prototype.name = D2FInterpreterError.name;

module.exports = {
  D2CalcError,
  D2CalcInternalError,
  D2FError,
  D2FSyntaxError,
  D2FInterpreterError,
};
