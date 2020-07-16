"use strict";

const tokenize = require("./lexer.js");

const {
  ClosingParenthesisToken,
  ColonToken,
  CommaToken,
  DotCodeToken,
  IdentifierToken,
  NumberToken,
  OpeningParenthesisToken,
  OperatorToken,
  QuestionMarkToken,
  ReferenceToken,
  Token,
} = tokenize;

/**
 * Parses the given string.
 *
 * @param {string} text
 * @return {AstExpression}
 * @throws {Error} If the expression is malformed.
 */
function parse(text) {
  const tokens = tokenize(text);
  const tokenStream = new TokenStream(tokens);
  const expression = parseExpression(tokenStream);

  const leftoverToken = tokenStream.peek();
  if (leftoverToken) {
    throw new Error(
      `Unexpected token "${leftoverToken.rawValue}" at position ${leftoverToken.position}`
    );
  }

  return expression;
}

/**
 * Describes the precedence of binary operators.
 * Precedence values must be nonnegative integers.
 */
const BINARY_OPERATOR_PRECEDENCE = {
  "*": 2,
  "/": 2,
  "+": 1,
  "-": 1,
  "==": 0,
  "!=": 0,
  "<": 0,
  ">": 0,
  "<=": 0,
  ">=": 0,
};

/**
 * Parses an expression from a token stream.
 *
 * @param {TokenStream} tokenStream
 * @param {number?} minPrecedence Minimum precedence of operators to accept.
 *    Operators whose precedence is lower than this value are not be parsed.
 * @return {AstExpression}
 * @throws {Error} If an expression is malformed.
 */
function parseExpression(tokenStream, minPrecedence = 0) {
  let expression = parseUnaryExpression(tokenStream);

  let operatorToken;
  while ((operatorToken = tokenStream.peek()) instanceof OperatorToken) {
    const { operator } = operatorToken;
    const precedence = BINARY_OPERATOR_PRECEDENCE[operator];
    if (typeof precedence !== "number") {
      throw new Error(`No known precedence for operator "${operator}"`);
    }

    // Stop parsing if the operator has less precedence than the minimum allowed
    if (precedence < minPrecedence) break;

    tokenStream.next();

    // When parsing the right-side expression, only allow operators with higher
    // precedence than the current one. This ensures that operators with equal
    // precedence are parsed left-associatively.
    const rightExpression = parseExpression(tokenStream, precedence + 1);
    expression = new AstBinaryOp(operator, expression, rightExpression);
  }

  return expression;
}

/**
 * Attempts to parse an Unary Expression.
 *
 * @param {TokenStream} tokenStream
 * @return {AstExpression}
 * @throws {Error} If an expression is malformed.
 */
function parseUnaryExpression(tokenStream) {
  const token = tokenStream.peek();
  if (token instanceof OperatorToken && token.operator === "-") {
    tokenStream.next();
    const innerExpression = parseConditionalExpression(tokenStream);
    return new AstUnaryOp(token.operator, innerExpression);
  }

  return parseConditionalExpression(tokenStream);
}

/**
 * Attempts to parse a Conditional Expression.
 *
 * @param {TokenStream} tokenStream
 * @return {AstPrimaryExpression | AstConditional}
 * @throws {Error} If an expression is malformed.
 */
function parseConditionalExpression(tokenStream) {
  let conditionExpr = parsePrimaryExpression(tokenStream);

  let questionToken;
  while ((questionToken = tokenStream.peek()) instanceof QuestionMarkToken) {
    tokenStream.next();

    const trueExpr = parsePrimaryExpression(tokenStream);

    const colonToken = tokenStream.next().value;
    assertTokenIsInstanceOf(
      colonToken,
      ColonToken,
      `; expected a colon (:) for conditional expression "${questionToken.rawValue}" at position ${questionToken.position}`
    );

    const falseExpr = parsePrimaryExpression(tokenStream);

    conditionExpr = new AstConditional(conditionExpr, trueExpr, falseExpr);
  }

  return conditionExpr;
}

/**
 * Attempts to parse a Primary Expression.
 *
 * @param {TokenStream} tokenStream
 * @return {AstPrimaryExpression}
 * @throws {Error} If an expression is malformed.
 */
function parsePrimaryExpression(tokenStream) {
  const token = tokenStream.next().value;

  if (token instanceof NumberToken) {
    return new AstNumber(token.number);
  }

  if (token instanceof IdentifierToken) {
    return parseFunctionCallArgumentList(tokenStream, token);
  }

  if (token instanceof OpeningParenthesisToken) {
    const innerExpression = parseExpression(tokenStream);

    const endToken = tokenStream.next().value;
    assertTokenIsInstanceOf(
      endToken,
      ClosingParenthesisToken,
      `; expected a ")" that matches the "(" at position ${token.position}`
    );

    return new AstParenthesizedExpression(innerExpression);
  }

  throw new Error(
    `Unexpected token "${token.rawValue}" at position ${token.position}`
  );
}

/**
 * Attempts to parse the argument list (with parentheses) of a function call or
 * a reference function call.
 *
 * If the next token is not an argument list (does not start with a '('),
 * returns an `AstIdentifier` instead.
 *
 * @param {TokenStream} tokenStream
 * @param {InstanceType<IdentifierToken>} identifierToken Identifier token for
 *    the function name
 * @return {AstFunctionCall | AstRefFunctionCall | AstIdentifier}
 * @throws {Error} If an expression is malformed.
 */
function parseFunctionCallArgumentList(tokenStream, identifierToken) {
  const argListBeginToken = tokenStream.peek();
  // Not a function argument list
  if (!(argListBeginToken instanceof OpeningParenthesisToken)) {
    return new AstIdentifier(identifierToken.rawValue);
  }
  tokenStream.next();

  const funcName = identifierToken.rawValue;
  const funcPos = identifierToken.position;

  // Parse argument list
  const firstArgToken = tokenStream.peek();
  assertIsNotEndOfInput(
    firstArgToken,
    `; expected first argument for function "${funcName}" at position ${funcPos}`
  );

  // Definitely a reference function call
  if (firstArgToken instanceof ReferenceToken) {
    tokenStream.next();

    const dotCodeToken1 = tokenStream.next().value;
    assertTokenIsInstanceOf(
      dotCodeToken1,
      DotCodeToken,
      `; expected first dot code for reference function "${funcName}" at position ${funcPos}`
    );

    return finishParsingReferenceCall(
      tokenStream,
      identifierToken,
      firstArgToken.reference,
      dotCodeToken1.code
    );
  }

  // Is either a function call or a reference function call
  // Attempt to parse the first argument as an expression
  const argExpression1 = parseExpression(tokenStream);

  const commaOrDotCodeToken = tokenStream.next().value;
  // Definitely a function call
  if (commaOrDotCodeToken instanceof CommaToken) {
    const argExpression2 = parseExpression(tokenStream);

    const endToken = tokenStream.next().value;
    assertTokenIsInstanceOf(
      endToken,
      ClosingParenthesisToken,
      `; expected a closing parenthesis for function "${funcName}" at position ${funcPos}`
    );

    return new AstFunctionCall(funcName, argExpression1, argExpression2);
  } else {
    assertTokenIsInstanceOf(
      commaOrDotCodeToken,
      DotCodeToken,
      `; expected a comma (,) or dot-code (.code) for function "${funcName}" at position ${funcPos}`
    );

    if (!(argExpression1 instanceof AstPrimaryExpression)) {
      throw new Error(
        `Disallowed expression at position ${firstArgToken.position}` +
          `; the first argument of the reference function "${funcName}" must be ` +
          `a number, identifier, or an expression wrapped in parentheses ("()")`
      );
    }

    return finishParsingReferenceCall(
      tokenStream,
      identifierToken,
      argExpression1,
      commaOrDotCodeToken.code
    );
  }
}

/**
 * Attempts to parse the second dot code of a reference function call (if it
 * exists), as well as the closing parenthesis (`)`).
 *
 * @param {TokenStream} tokenStream
 * @param {InstanceType<IdentifierToken>} identifier
 *    Identifier token for the reference function name
 * @param {string | AstPrimaryExpression} ref
 *    First argument for the reference function
 * @param {string} dotCode1 First dot code for the reference function
 * @return {AstRefFunctionCall}
 * @throws {Error} If an expression is malformed.
 */
function finishParsingReferenceCall(tokenStream, identifier, ref, dotCode1) {
  const funcName = identifier.rawValue;
  const funcPos = identifier.position;

  const dotCodeToken2 = tokenStream.next().value;
  assertIsNotEndOfInput(
    dotCodeToken2,
    `; expected a closing parenthesis (")") or second dot code for reference function "${funcName}" at position ${funcPos}`
  );

  let dotCode2;
  // Single arg
  if (dotCodeToken2 instanceof ClosingParenthesisToken) {
    dotCode2 = null;
  } else {
    assertTokenIsInstanceOf(
      dotCodeToken2,
      DotCodeToken,
      `; expected a closing parenthesis (")") or second dot code for reference function "${funcName}" at position ${funcPos}`
    );
    dotCode2 = dotCodeToken2.code;

    const endToken = tokenStream.next().value;
    assertTokenIsInstanceOf(
      endToken,
      ClosingParenthesisToken,
      `; expected a closing parenthesis (")") for reference function "${funcName}" at position ${funcPos}`
    );
  }

  return new AstRefFunctionCall(funcName, ref, dotCode1, dotCode2);
}

/**
 * Asserts that `token` is not an end-of-input token.
 *
 * @param {InstanceType<Token> | undefined} token
 * @param {string?} extraMessage String to append to the default error message
 * @return {asserts token}
 * @throws {Error} If `token` is an end-of-input token
 */
function assertIsNotEndOfInput(token, extraMessage = "") {
  if (!token) {
    throw new Error(`Unexpected end of input${extraMessage}`);
  }
}

/**
 * A generic constructor type.
 * Based on https://dev.to/krumpet/generic-type-guard-in-typescript-258l
 * @template T
 * @typedef {{ new (...args: any[]): T }} Constructor
 */

/**
 * Asserts that `token` is an instance of `tokenConstructor`.
 *
 * @param {InstanceType<Token> | undefined} token
 * @template {InstanceType<Token>} T
 * @param {Constructor<T>} tokenConstructor
 * @param {string?} extraMessage String to append to the default error message
 * @return {asserts token is T}
 * @throws {Error} If `token` is an end-of-input token, or otherwise not an
 *    instance of `tokenConstructor`
 */
function assertTokenIsInstanceOf(token, tokenConstructor, extraMessage = "") {
  assertIsNotEndOfInput(token, extraMessage);
  if (!(token instanceof tokenConstructor)) {
    throw new Error(
      `Unexpected token "${token.rawValue}" at position ${token.position}`
    );
  }
}

/**
 * A token stream that supports peeking. Implements the iterator protocol.
 */
class TokenStream {
  /**
   * @param {InstanceType<Token>[]} tokens Array of tokens
   */
  constructor(tokens) {
    /** @private */
    this.tokens_ = tokens;
    /** @private */
    this.currentIndex_ = 0;
  }

  /**
   * Returns the next token object in the stream, or `undefined` if the stream
   * contains no more tokens.
   *
   * @return {IteratorResult<InstanceType<Token>, undefined>}
   */
  next() {
    const value = this.tokens_[this.currentIndex_];
    if (value) {
      this.currentIndex_++;
      return { value };
    } else {
      return { done: true, value: undefined };
    }
  }

  /**
   * Returns the next token object in the stream, or `undefined` if the stream
   * contains no more tokens.
   *
   * @return {InstanceType<Token> | undefined}
   */
  peek() {
    return this.tokens_[this.currentIndex_];
  }
}

/** Base class for AST expression nodes */
class AstExpression {}

class AstBinaryOp extends AstExpression {
  /**
   * @param {"+" | "-" | "*" | "/" | "==" | "!=" | "<" | ">" | "<=" | ">="} operator
   * @param {AstExpression} left Left side expression
   * @param {AstExpression} right Right side expression
   */
  constructor(operator, left, right) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

class AstUnaryOp extends AstExpression {
  /**
   * @param {"-"} operator Unary operator
   * @param {AstExpression} expression Expression to apply the operator
   */
  constructor(operator, expression) {
    super();
    this.operator = operator;
    this.expression = expression;
  }
}

class AstConditional extends AstExpression {
  /**
   * @param {AstPrimaryExpression | AstConditional} condition
   * @param {AstPrimaryExpression} trueExpression Expression to evaluate if condition is true (non-zero)
   * @param {AstPrimaryExpression} falseExpression Expression to evaluate if condition is false (zero)
   */
  constructor(condition, trueExpression, falseExpression) {
    super();
    this.condition = condition;
    this.trueExpression = trueExpression;
    this.falseExpression = falseExpression;
  }
}

/**
 * Base class for primary expressions.
 * This class is needed by the parser.
 */
class AstPrimaryExpression extends AstExpression {}

class AstNumber extends AstPrimaryExpression {
  /**
   * @param {number} value Must be a nonnegative number
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class AstIdentifier extends AstPrimaryExpression {
  /**
   * @param {string} name
   */
  constructor(name) {
    super();
    this.name = name;
  }
}

class AstFunctionCall extends AstPrimaryExpression {
  /**
   * @param {string} functionName
   * @param {AstExpression} arg1
   * @param {AstExpression} arg2
   */
  constructor(functionName, arg1, arg2) {
    super();
    this.functionName = functionName;
    this.arg1 = arg1;
    this.arg2 = arg2;
  }
}

class AstRefFunctionCall extends AstPrimaryExpression {
  /**
   * @param {string} functionName
   * @param {string | AstPrimaryExpression} reference
   * @param {string} identifier1
   * @param {string | null} identifier2
   */
  constructor(functionName, reference, identifier1, identifier2) {
    super();
    this.functionName = functionName;
    this.reference = reference;
    this.identifier1 = identifier1;
    this.identifier2 = identifier2;
  }
}

/**
 * An expression wrapped in parentheses.
 * This node is meaningful only for parsing, and does not affect the interpreter.
 */
class AstParenthesizedExpression extends AstPrimaryExpression {
  /**
   * @param {AstExpression} expression
   */
  constructor(expression) {
    super();
    this.expression = expression;
  }
}

module.exports = parse;
module.exports.AstExpression = AstExpression;
module.exports.AstNumber = AstNumber;
module.exports.AstBinaryOp = AstBinaryOp;
module.exports.AstUnaryOp = AstUnaryOp;
module.exports.AstConditional = AstConditional;
module.exports.AstPrimaryExpression = AstPrimaryExpression;
module.exports.AstIdentifier = AstIdentifier;
module.exports.AstFunctionCall = AstFunctionCall;
module.exports.AstRefFunctionCall = AstRefFunctionCall;
module.exports.AstParenthesizedExpression = AstParenthesizedExpression;
