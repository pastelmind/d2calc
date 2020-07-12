"use strict";

/**
 * Tokenizes the given string.
 *
 * @param {string} text
 * @return {Token[]}
 */
function tokenize(text) {
  /** @type {Token[]} */
  const tokens = [];

  return tokens;
}

/** Base class for tokens. */
class Token {}

class NumberToken extends Token {
  /**
   * @param {number} value Must be a nonnegative integer.
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class IdentifierToken extends Token {
  /**
   * @param {string} value Name of the identifier
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class ReferenceToken extends Token {
  /**
   * @param {string} value Name of a skill, missile, or stat
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class OperatorToken extends Token {
  /**
   * @param {string} operator
   */
  constructor(operator) {
    super();
    this.operator = operator;
  }
}

class OpeningParenthesisToken extends Token {}
class ClosingParenthesisToken extends Token {}

/** Token used by function call expressions */
class DotToken extends Token {}
/** Token used by function call expressions */
class CommaToken extends Token {}

/** Token used by conditional expressions */
class QuestionMarkToken extends Token {}

/** Token used by conditional expressions */
class ColonToken extends Token {}

module.exports = tokenize;
module.exports.Token = Token;
module.exports.NumberToken = NumberToken;
module.exports.IdentifierToken = IdentifierToken;
module.exports.ReferenceToken = ReferenceToken;
module.exports.OperatorToken = OperatorToken;
module.exports.OpeningParenthesisToken = OpeningParenthesisToken;
module.exports.ClosingParenthesisToken = ClosingParenthesisToken;
module.exports.DotToken = DotToken;
module.exports.CommaToken = CommaToken;
module.exports.QuestionMarkToken = QuestionMarkToken;
module.exports.ColonToken = ColonToken;
