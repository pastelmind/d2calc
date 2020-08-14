import { D2CalcInternalError, D2FInterpreterError } from "./errors.js";
import { toInt32 } from "./int32.js";
import { parse } from "./parser.js";

/**
 * @typedef {import("./errors.js").D2FSyntaxError} D2FSyntaxError
 * @typedef {import("./int32.js").Int32} Int32
 * @typedef {import("./parser.js").AstBinaryOp} AstBinaryOp
 * @typedef {import("./parser.js").AstConditional} AstConditional
 * @typedef {import("./parser.js").AstExpression} AstExpression
 * @typedef {import("./parser.js").AstFunctionCall} AstFunctionCall
 * @typedef {import("./parser.js").AstIdentifier} AstIdentifier
 * @typedef {import("./parser.js").AstNumber} AstNumber
 * @typedef {import("./parser.js").AstRefFunctionCall} AstRefFunctionCall
 * @typedef {import("./parser.js").AstUnaryOp} AstUnaryOp
 */

/**
 * @typedef {() => number} IdentifierFunction
 * Function that returns a signed 32-bit integer.
 */

/**
 * @typedef {(a: number, b: number) => number} NumericFunction
 * Function that takes two numbers as arguments and returns a number.
 */

/**
 * @typedef {(reference: string | number, qualifier: string) => number} ReferenceFunction
 * Function that takes a reference and a qualifier as arguments and returns a
 * number.
 */

/**
 * @typedef {(reference: string | number, qualifier1: string, qualifier2: string) => number} ReferenceFunction2Q
 * Function that takes a reference and two qualifiers as arguments and returns a
 * number.
 */

/**
 * @typedef {object} InterpreterEnvironment Interpreter environment object
 * @property {{[name: string]: IdentifierFunction | number}=} identifiers
 *    Identifiers available in the environment.
 *    If a number is given, it is used directly as the identifier's value.
 *    If a function is given, its return value is used.
 * @property {{[name: string]: NumericFunction}=} functions
 *    Numeric functions available in the environment.
 * @property {{[name: string]: ReferenceFunction}=} referenceFunctions
 *    Single-qualifier reference functions available in the environment.
 * @property {{[name: string]: ReferenceFunction2Q}=} referenceFunctions2Q
 *    Double-qualifier reference functions available in the environment.
 */

/**
 * Interprets D2F code and returns the result.
 *
 * If the D2F code uses an identifier, function, or reference function, the
 * interpreter will use the callbacks in the environment to compute its value.
 * All callbacks must return a signed 32-bit integer.
 *
 * @param {string} text D2F code
 * @param {InterpreterEnvironment=} environment Environment to use when
 *    interpreting the code
 * @return {number} Signed 32-bit integer
 * @throws {D2FSyntaxError} If the code is syntactically invalid
 * @throws {D2FInterpreterError} If the code is syntactically valid, but an
 *    error occurs while interpreting the result
 */
export function interpret(text, environment = {}) {
  const expression = parse(text);
  return interpretExpression(expression, environment);
}

/**
 * Evaluates an AST expression node.
 *
 * @param {AstExpression} expression
 * @param {InterpreterEnvironment} environment Environment to use when
 *    interpreting the expression
 * @return {Int32} Signed 32-bit integer
 * @throws {D2FSyntaxError} If the code is syntactically invalid
 * @throws {D2FInterpreterError} If the code is syntactically valid, but an
 *    error occurs while interpreting the result
 */
export function interpretExpression(expression, environment) {
  switch (expression.type) {
    case "AstBinaryOp":
      return interpretBinaryOp(expression, environment);
    case "AstConditional": {
      const conditionValue = interpretExpression(
        expression.condition,
        environment
      );

      if (conditionValue !== 0) {
        return interpretExpression(expression.trueExpression, environment);
      } else {
        return interpretExpression(expression.falseExpression, environment);
      }
    }
    case "AstFunctionCall":
      return interpretFunctionCall(expression, environment);
    case "AstIdentifier":
      return interpretIdentifier(expression, environment);
    case "AstNumber":
      return expression.value;
    case "AstRefFunctionCall":
      return interpretRefFunctionCall(expression, environment);
    case "AstUnaryOp": {
      switch (expression.operator) {
        case "-":
          return toInt32(
            -interpretExpression(expression.expression, environment)
          );
        default:
          throw new D2CalcInternalError(
            `Unknown operator: "${expression.operator}"`
          );
      }
    }
  }

  // Exhaustiveness check
  assertUnhandledExpressionType(expression);
}

/**
 * Helper function to assist TypeScript's exhaustiveness check.
 *
 * @param {never} e
 * @return {never}
 */
function assertUnhandledExpressionType(e) {
  throw new D2CalcInternalError(
    // @ts-ignore Suppress because we want to retrieve the constructor name
    `Unknown expression type: ${e ? e.constructor.name : e}`
  );
}

/**
 * @param {AstBinaryOp} expression
 * @param {InterpreterEnvironment} environment
 * @return {Int32}
 */
function interpretBinaryOp(expression, environment) {
  const leftValue = interpretExpression(expression.left, environment);
  const rightValue = interpretExpression(expression.right, environment);

  switch (expression.operator) {
    case "+":
      return toInt32(leftValue + rightValue);
    case "-":
      return toInt32(leftValue - rightValue);
    case "*":
      return /** @type {Int32} */ (Math.imul(leftValue, rightValue));
    case "/":
      if (rightValue === 0) {
        return /** @type {Int32} */ (0);
      } else {
        return /** @type {Int32} */ (Math.trunc(leftValue / rightValue));
      }
    case "==":
      return /** @type {Int32} */ (leftValue === rightValue ? 1 : 0);
    case "!=":
      return /** @type {Int32} */ (leftValue !== rightValue ? 1 : 0);
    case "<":
      return /** @type {Int32} */ (leftValue < rightValue ? 1 : 0);
    case ">":
      return /** @type {Int32} */ (leftValue > rightValue ? 1 : 0);
    case "<=":
      return /** @type {Int32} */ (leftValue <= rightValue ? 1 : 0);
    case ">=":
      return /** @type {Int32} */ (leftValue >= rightValue ? 1 : 0);
    default:
      throw new D2CalcInternalError(
        `Unknown operator: "${expression.operator}"`
      );
  }
}

/**
 * @param {AstFunctionCall} expression
 * @param {InterpreterEnvironment} environment
 * @return {Int32}
 */
function interpretFunctionCall(expression, environment) {
  const { functionName, arg1, arg2 } = expression;
  const { functions = {} } = environment;
  const func = Object.prototype.hasOwnProperty.call(functions, functionName)
    ? functions[functionName]
    : undefined;

  if (func == undefined) {
    throw new D2FInterpreterError(`Unknown function: ${functionName}`);
  } else {
    const argValue1 = interpretExpression(arg1, environment);
    const argValue2 = interpretExpression(arg2, environment);

    try {
      return toInt32(func(argValue1, argValue2));
    } catch (e) {
      if (e instanceof Error) {
        e.message += ` (caused while calling function "${functionName})"`;
      }
      throw e;
    }
  }
}

/**
 * @param {AstIdentifier} expression
 * @param {InterpreterEnvironment} environment
 * @return {Int32}
 */
function interpretIdentifier(expression, environment) {
  const { identifiers = {} } = environment;
  const identifier = Object.prototype.hasOwnProperty.call(
    identifiers,
    expression.name
  )
    ? identifiers[expression.name]
    : undefined;

  if (identifier == undefined) {
    throw new D2FInterpreterError(`Unknown identifier: ${expression.name}`);
  } else if (typeof identifier === "number") {
    return toInt32(identifier);
  } else {
    try {
      return toInt32(identifier());
    } catch (e) {
      if (e instanceof Error) {
        e.message += ` (caused while evaluating identifier "${expression.name})"`;
      }
      throw e;
    }
  }
}

/**
 * @param {AstRefFunctionCall} expression
 * @param {InterpreterEnvironment} environment
 * @return {Int32}
 */
function interpretRefFunctionCall(expression, environment) {
  const { functionName, reference, code1, code2 } = expression;

  if (code2 == null) {
    const { referenceFunctions = {} } = environment;
    const func = Object.prototype.hasOwnProperty.call(
      referenceFunctions,
      functionName
    )
      ? referenceFunctions[functionName]
      : undefined;

    if (func == undefined) {
      throw new D2FInterpreterError(
        `Unknown single-qualifier reference function: ${functionName}`
      );
    } else {
      let refValue;
      if (typeof reference === "string") {
        refValue = reference;
      } else {
        refValue = interpretExpression(reference, environment);
      }

      try {
        return toInt32(func(refValue, code1));
      } catch (e) {
        if (e instanceof Error) {
          e.message += ` (caused while evaluating single-qualifier reference function "${functionName})"`;
        }

        throw e;
      }
    }
  } else {
    const { referenceFunctions2Q = {} } = environment;
    const func = Object.prototype.hasOwnProperty.call(
      referenceFunctions2Q,
      functionName
    )
      ? referenceFunctions2Q[functionName]
      : undefined;

    if (func == undefined) {
      throw new D2FInterpreterError(
        `Unknown double-qualifier reference function: ${functionName}`
      );
    } else {
      let refValue;
      if (typeof reference === "string") {
        refValue = reference;
      } else {
        refValue = interpretExpression(reference, environment);
      }

      try {
        return toInt32(func(refValue, code1, code2));
      } catch (e) {
        if (e instanceof Error) {
          e.message += ` (caused while evaluating double-qualifier reference function "${functionName})"`;
        }

        throw e;
      }
    }
  }
}
