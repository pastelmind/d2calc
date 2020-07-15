"use strict";

const tokenize = require("./lexer.js");

const {
  AdditiveOperatorToken,
  ClosingParenthesisToken,
  ColonToken,
  CommaToken,
  ComparisonOperatorToken,
  DotCodeToken,
  IdentifierToken,
  MultiplicativeOperatorToken,
  NumberToken,
  OpeningParenthesisToken,
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
      `Unparsed token: "${leftoverToken.rawValue}" at position ${leftoverToken.position}`
    );
  }

  return expression;
}

/**
 * Attempts to parse a stream of tokens, starting at a given index.
 *
 * @param {TokenStream} tokenStream
 * @return {AstExpression}
 * @throws {Error} If an expression is malformed.
 */
function parseExpression(tokenStream) {
  const leftExpression = parseAdditiveExpression(tokenStream);

  const token = tokenStream.next().value;
  // Early end
  if (!token) {
    return leftExpression;
  }
  assertTokenIsInstanceOf(token, ComparisonOperatorToken);

  const rightExpression = parseExpression(tokenStream);

  return new AstBinaryOp(token.operator, leftExpression, rightExpression);
}

/**
 * Attempts to parse an Additive Expression.
 *
 * @param {TokenStream} tokenStream
 * @return {AstExpression}
 * @throws {Error} If an expression is malformed.
 */
function parseAdditiveExpression(tokenStream) {
  const leftExpression = parseMultiplicativeExpression(tokenStream);

  const token = tokenStream.next().value;
  // Early end
  if (!token) {
    return leftExpression;
  }
  assertTokenIsInstanceOf(token, AdditiveOperatorToken);

  const rightExpression = parseAdditiveExpression(tokenStream);

  return new AstBinaryOp(token.operator, leftExpression, rightExpression);
}

/**
 * Attempts to parse a Multiplicative Expression.
 *
 * @param {TokenStream} tokenStream
 * @return {AstExpression}
 * @throws {Error} If an expression is malformed.
 */
function parseMultiplicativeExpression(tokenStream) {
  const leftExpression = parseUnaryExpression(tokenStream);

  const token = tokenStream.next().value;
  // Early end
  if (!token) {
    return leftExpression;
  }
  assertTokenIsInstanceOf(token, MultiplicativeOperatorToken);

  const rightExpression = parseMultiplicativeExpression(tokenStream);

  return new AstBinaryOp(token.operator, leftExpression, rightExpression);
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
  if (token instanceof AdditiveOperatorToken && token.operator === "-") {
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
 * @return {AstExpression}
 * @throws {Error} If an expression is malformed.
 */
function parseConditionalExpression(tokenStream) {
  const conditionExpr = parsePrimaryExpression(tokenStream);

  const token1 = tokenStream.next().value;
  // Early end
  if (!token1) {
    return conditionExpr;
  }
  assertTokenIsInstanceOf(token1, QuestionMarkToken);

  const trueExpr = parsePrimaryExpression(tokenStream);

  const token2 = tokenStream.next().value;
  assertTokenIsInstanceOf(
    token2,
    ColonToken,
    `; expected a colon (:) for conditional expression "${token1.rawValue}" at position ${token1.position}`
  );

  const falseExpr = parsePrimaryExpression(tokenStream);

  return new AstConditional(conditionExpr, trueExpr, falseExpr);
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
    const argListBeginToken = tokenStream.peek();
    // Early end
    if (!(argListBeginToken instanceof OpeningParenthesisToken)) {
      return new AstIdentifier(token.rawValue);
    }
    tokenStream.next();

    const funcName = token.rawValue;
    const funcPos = token.position;

    // Parse argument list
    const firstArgToken = tokenStream.peek();
    assertIsNotEndOfInput(
      firstArgToken,
      `; expected first argument for function "${funcName}" at position ${funcPos}`
    );

    // Definitely a reference function call
    if (firstArgToken instanceof ReferenceToken) {
      tokenStream.next();
      const ref = firstArgToken.reference;

      const dotCodeToken1 = tokenStream.next().value;
      assertTokenIsInstanceOf(
        dotCodeToken1,
        DotCodeToken,
        `; expected first dot code for reference function "${funcName}" at position ${funcPos}`
      );
      const dotCode1 = dotCodeToken1.code;

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

    // Is either a function call or a reference function call
    // Attempt to parse the first argument as an expression
    const argExpr1 = parseExpression(tokenStream);

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

      return new AstFunctionCall(funcName, argExpr1, argExpression2);
    } else {
      assertTokenIsInstanceOf(
        commaOrDotCodeToken,
        DotCodeToken,
        `; expected a comma (,) or dot-code (.code) for function "${funcName}" at position ${funcPos}`
      );
      const dotCode1 = commaOrDotCodeToken.code;

      if (!(argExpr1 instanceof AstPrimaryExpression)) {
        throw new Error(
          `Disallowed expression at position ${firstArgToken.position}` +
            `; the first argument of the reference function "${funcName}" must be ` +
            `a number, identifier, or an expression wrapped in parentheses ("()")`
        );
      }

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

      return new AstRefFunctionCall(funcName, argExpr1, dotCode1, dotCode2);
    }
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
      `Unexpected token "${token.rawValue}" a position ${token.position}`
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
   * @param {AstPrimaryExpression} condition
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
   * @param {string | AstExpression} reference
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
