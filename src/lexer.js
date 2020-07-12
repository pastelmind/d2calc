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

  let currentPos = 0;
  let matchedStr;
  while (currentPos < text.length) {
    const currentCh = text.charAt(currentPos);

    // Symbols
    switch (currentCh) {
      case "(":
        tokens.push(new OpeningParenthesisToken());
        ++currentPos;
        continue;
      case ")":
        tokens.push(new ClosingParenthesisToken());
        ++currentPos;
        continue;
      case "?":
        tokens.push(new QuestionMarkToken());
        ++currentPos;
        continue;
      case ":":
        tokens.push(new ColonToken());
        ++currentPos;
        continue;
      case ".":
        tokens.push(new DotToken());
        ++currentPos;
        continue;
      case ",":
        tokens.push(new CommaToken());
        ++currentPos;
        continue;
    }

    if ((matchedStr = matchOperator(text, currentPos))) {
      tokens.push(new OperatorToken(matchedStr));
      currentPos += matchedStr.length;
    } else if ((matchedStr = matchNumber(text, currentPos))) {
      tokens.push(new NumberToken(parseInt(matchedStr)));
      currentPos += matchedStr.length;
    } else if ((matchedStr = matchIdentifier(text, currentPos))) {
      tokens.push(new IdentifierToken(matchedStr));
      currentPos += matchedStr.length;
    } else if ((matchedStr = matchWhitespace(text, currentPos))) {
      currentPos += matchedStr.length;
    } else {
      const endPos = currentPos + 10;
      let textShown = text.slice(currentPos, endPos);
      if (endPos < text.length) textShown += "...";
      throw new Error(
        `Cannot parse token at index ${currentPos} of input: ${textShown}`
      );
    }
  }

  return tokens;
}

/**
 * Attempts to match an operator in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null}
 */
function matchOperator(text, index) {
  const pattern = /[-+*/]|<=?|>=?|==|!=/y;
  pattern.lastIndex = index;
  const result = pattern.exec(text);
  return result ? result[0] : null;
}

/**
 * Attempts to match a number in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null}
 */
function matchNumber(text, index) {
  const pattern = /\d+/y;
  pattern.lastIndex = index;
  const result = pattern.exec(text);
  return result ? result[0] : null;
}

/**
 * Attempts to match an identifier in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null}
 */
function matchIdentifier(text, index) {
  const pattern = /[a-z]\w*/iy;
  pattern.lastIndex = index;
  const result = pattern.exec(text);
  return result ? result[0] : null;
}

/**
 * Attempts to match consecutive whitespaces at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null}
 */
function matchWhitespace(text, index) {
  const pattern = /\s+/iy;
  pattern.lastIndex = index;
  const result = pattern.exec(text);
  return result ? result[0] : null;
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
