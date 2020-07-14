"use strict";

const tokenize = require("./lexer.js");

const {
  ClosingParenthesisToken,
  CommaToken,
  DotToken,
  IdentifierToken,
  NumberToken,
  OpeningParenthesisToken,
  OperatorToken,
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
  const [expression, tokensConsumed] = parseExpression(tokens, 0);

  if (tokensConsumed < tokens.length) {
    const unparsedTokens = tokens.slice(tokensConsumed);
    throw new Error(`Unparsed tokens remaining: ${unparsedTokens}`);
  }

  return expression;
}

/**
 * Attempts to parse a stream of tokens, starting at a given index.
 *
 * @param {InstanceType<Token>[]} tokens
 * @param {number} currentTokenIndex
 * @return {[ AstExpression , number ]} Tuple of `[ expr, tokensConsumed ]`.
 *    `expr` is the parsed AST node, and `tokensConsumed` is the number of
 *    tokens consumed in the process.
 * @throws {Error} If an expression is malformed.
 */
function parseExpression(tokens, currentTokenIndex) {
  if (currentTokenIndex >= tokens.length) {
    throw new Error("Unexpected end of input");
  }
  const currentToken = tokens[currentTokenIndex];

  if (currentToken instanceof NumberToken) {
    return [new AstNumber(currentToken.value), 1];
  }

  if (currentToken instanceof IdentifierToken) {
    const secondToken = tokens[currentTokenIndex + 1];
    if (!(secondToken instanceof OpeningParenthesisToken)) {
      // Plain identifier
      return [new AstIdentifier(currentToken.value), 1];
    }

    const arg1TokenIndex = currentTokenIndex + 2;
    if (arg1TokenIndex >= tokens.length) {
      throw new Error(
        `Unexpected end of input; expected first argument for function ${currentToken.value} at position ${currentToken.position}`
      );
    }
    const arg1Token = tokens[arg1TokenIndex];

    if (arg1Token instanceof ReferenceToken) {
      // Definitely a reference function call
      const separator1TokenIndex = currentTokenIndex + 3;
      if (separator1TokenIndex >= tokens.length) {
        throw new Error(
          `Unexpected end of input; expected first separator for function ${currentToken.value} at position ${currentToken.position}`
        );
      }
      const separator1Token = tokens[separator1TokenIndex];
      if (!(separator1Token instanceof DotToken)) {
        throw new Error(
          `Unexpected token ${separator1Token} at position ${separator1Token.position}; expected a dot (.)`
        );
      }

      const identifier1TokenIndex = currentTokenIndex + 3;
      if (identifier1TokenIndex >= tokens.length) {
        throw new Error(
          `Unexpected end of input; expected first identifier for function ${currentToken.value} at position ${currentToken.position}`
        );
      }
      const identifier1Token = tokens[identifier1TokenIndex];
      if (!(identifier1Token instanceof IdentifierToken)) {
        throw new Error(
          `Unexpected token ${identifier1Token} at position ${identifier1Token.position}; expected an identifier`
        );
      }

      const separator2TokenIndex = currentTokenIndex + 3;
      if (separator2TokenIndex >= tokens.length) {
        throw new Error(
          `Unexpected end of input; expected second separator for function ${currentToken.value} at position ${currentToken.position}`
        );
      }
      const separator2Token = tokens[separator2TokenIndex];
      if (separator2Token instanceof ClosingParenthesisToken) {
        // Reference function call with one identifier
        return [
          new AstReferenceFunctionCall(
            currentToken.value,
            arg1Token.value,
            identifier1Token.value,
            null
          ),
          3,
        ];
      }
      if (!(separator2Token instanceof DotToken)) {
        throw new Error(
          `Unexpected token ${separator2Token} at position ${separator2Token.position}; expected a dot (.)`
        );
      }

      const identifier2TokenIndex = currentTokenIndex + 3;
      if (identifier2TokenIndex >= tokens.length) {
        throw new Error(
          `Unexpected end of input; expected second identifier for function ${currentToken.value} at position ${currentToken.position}`
        );
      }
      const identifier2Token = tokens[identifier2TokenIndex];
      if (!(identifier2Token instanceof IdentifierToken)) {
        throw new Error(
          `Unexpected token ${identifier2Token} at position ${identifier2Token.position}; expected an identifier`
        );
      }

      const endTokenIndex = currentTokenIndex + 3;
      if (endTokenIndex >= tokens.length) {
        throw new Error(
          `Unexpected end of input; expected closing parenthesis for function ${currentToken.value} at position ${currentToken.position}`
        );
      }
      const endToken = tokens[endTokenIndex];
      if (!(endToken instanceof ClosingParenthesisToken)) {
        throw new Error(
          `Unexpected token ${endToken} at position ${endToken.position}; expected a closing parenthesis ()) for function ${currentToken.value} at position ${currentToken.position}`
        );
      }

      // Reference function call with two identifiers
      return [
        new AstReferenceFunctionCall(
          currentToken.value,
          arg1Token.value,
          identifier1Token.value,
          identifier2Token.value
        ),
        5,
      ];
    }
    if (arg1Token instanceof NumberToken) {
      //
    }

    const [arg1, arg1TokensConsumed] = parseExpression(tokens, arg1TokenIndex);

    const separator1TokenIndex = arg1TokenIndex + arg1TokensConsumed;
    const [separator1Token, separator1TokensConsumed] = parseExpression(
      tokens,
      separator1TokenIndex
    );
    if (separator1Token instanceof CommaToken) {
      // if (separator1Token instanceof )
      // Should be a pro
    }
  }

  if (currentToken instanceof OperatorToken) {
    const { operator } = currentToken;
    if (operator === "+" || operator === "-") {
      const [targetExpression, targetTokensConsumed] = parseExpression(
        tokens,
        currentTokenIndex + 1
      );
      return [
        new AstUnaryOp(operator, targetExpression),
        targetTokensConsumed + 1,
      ];
    }
  }

  if (currentToken instanceof OpeningParenthesisToken) {
    const [innerExpression, innerTokensConsumed] = parseExpression(
      tokens,
      currentTokenIndex + 1
    );

    const endTokenIndex = currentTokenIndex + 1 + innerTokensConsumed;
    if (endTokenIndex >= tokens.length) {
      throw new Error(`Unclosed parenthesis at ${currentToken.position}`);
    }
    const endToken = tokens[endTokenIndex];
    if (!(endToken instanceof ClosingParenthesisToken)) {
      throw new Error(
        `Unexpected token ${endToken} at position ${endToken.position}; expected a closing parenthesis`
      );
    }

    return [innerExpression, innerTokensConsumed + 2];
  }

  throw new Error(
    `Unexpected token ${currentToken} at position ${currentToken.position}`
  );
}

/** Base class for AST expression nodes */
class AstExpression {}

class AstNumber extends AstExpression {
  /**
   * @param {number} value Must be a nonnegative number
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class AstBinaryOp extends AstExpression {
  /**
   * @param {string} operator Binary operator
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
   * @param {string} operator Unary operator
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
   * @param {AstExpression} condition
   * @param {AstExpression} trueExpression Expression to evaluate if condition is true (non-zero)
   * @param {AstExpression} falseExpression Expression to evaluate if condition is false (zero)
   */
  constructor(condition, trueExpression, falseExpression) {
    super();
    this.condition = condition;
    this.trueExpression = trueExpression;
    this.falseExpression = falseExpression;
  }
}

class AstIdentifier extends AstExpression {
  /**
   * @param {string} name
   */
  constructor(name) {
    super();
    this.name = name;
  }
}

class AstFunctionCall extends AstExpression {
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

class AstReferenceFunctionCall extends AstExpression {
  /**
   * @param {string} functionName
   * @param {string | number} reference
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

module.exports = parse;
module.exports.AstExpression = AstExpression;
module.exports.AstNumber = AstNumber;
module.exports.AstBinaryOp = AstBinaryOp;
module.exports.AstUnaryOp = AstUnaryOp;
module.exports.AstConditional = AstConditional;
module.exports.AstIdentifier = AstIdentifier;
module.exports.AstFunctionCall = AstFunctionCall;
module.exports.AstReferenceFunctionCall = AstReferenceFunctionCall;
