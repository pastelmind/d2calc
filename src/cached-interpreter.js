import { interpretExpression } from "./interpreter.js";
import parse from "./parser.js";

/**
 * @typedef {import("./errors.js").D2FInterpreterError} D2FInterpreterError
 * @typedef {import("./errors.js").D2FSyntaxError} D2FSyntaxError
 * @typedef {import("./interpreter.js").InterpreterEnvironment} InterpreterEnvironment
 * @typedef {import("./parser.js").AstExpression} AstExpression
 */

/**
 * Interpreter that caches the parsed AST in memory, reusing it when the same
 * code is interpreted again.
 *
 * To "delete" the cache, simply delete the CachedInterpreter object.
 */
export class CachedInterpreter {
  constructor() {
    /**
     * @type {Map<string, AstExpression>}
     * @private
     */
    this.astCache_ = new Map();
  }

  /**
   * Interprets D2F code and returns the result.
   *
   * If the D2F code uses an identifier, function, or reference function, the
   * interpreter will use the callbacks in the environment to compute its value.
   * All callbacks must return a signed 32-bit integer.
   *
   * @param {string} text D2F code
   * @param {InterpreterEnvironment} environment Environment to use when
   *    interpreting the code
   * @return {number} Signed 32-bit integer
   * @throws {D2FSyntaxError} If the code is syntactically invalid
   * @throws {D2FInterpreterError} If the code is syntactically valid, but an
   *    error occurs while interpreting the result
   */
  interpret(text, environment = {}) {
    let expression = this.astCache_.get(text);
    if (!expression) {
      this.astCache_.set(text, (expression = parse(text)));
    }
    return interpretExpression(expression, environment);
  }
}
