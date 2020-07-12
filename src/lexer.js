"use strict";

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

module.exports = {
  Token,
  NumberToken,
  IdentifierToken,
  ReferenceToken,
  OperatorToken,
  OpeningParenthesisToken,
  ClosingParenthesisToken,
  DotToken,
  CommaToken,
  QuestionMarkToken,
  ColonToken,
};
