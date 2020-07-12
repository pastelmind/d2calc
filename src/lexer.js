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
        tokens.push(new OpeningParenthesisToken(currentPos));
        ++currentPos;
        continue;
      case ")":
        tokens.push(new ClosingParenthesisToken(currentPos));
        ++currentPos;
        continue;
      case "?":
        tokens.push(new QuestionMarkToken(currentPos));
        ++currentPos;
        continue;
      case ":":
        tokens.push(new ColonToken(currentPos));
        ++currentPos;
        continue;
      case ".":
        tokens.push(new DotToken(currentPos));
        ++currentPos;
        continue;
      case ",":
        tokens.push(new CommaToken(currentPos));
        ++currentPos;
        continue;
    }

    if ((matchedStr = matchOperator(text, currentPos))) {
      tokens.push(new OperatorToken(currentPos, matchedStr));
      currentPos += matchedStr.length;
    } else if ((matchedStr = matchNumber(text, currentPos))) {
      tokens.push(new NumberToken(currentPos, parseInt(matchedStr)));
      currentPos += matchedStr.length;
    } else if ((matchedStr = matchIdentifier(text, currentPos))) {
      tokens.push(new IdentifierToken(currentPos, matchedStr));
      currentPos += matchedStr.length;
    } else if ((matchedStr = matchReference(text, currentPos)) !== null) {
      tokens.push(new ReferenceToken(currentPos, matchedStr));
      // Account for opening/closing single-quotes
      currentPos += matchedStr.length + 2;
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

/**
 * Attempts to match a reference token in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null} If a reference token is successfully matched, returns
 *    the reference string (without the surrounding single-quotes). Note that
 *    the string can be empty.
 *    If the reference token cannot be matched, returns `null`.
 * @throws {Error} If the opening single-quote character is not matched by a
 *  closing single-quote character
 */
function matchReference(text, index) {
  if (text.charAt(index) !== "'") return null;

  const endIndex = text.indexOf("'", index + 1);
  if (endIndex === -1) {
    throw new Error(
      `No closing single-quote (') character for reference at index ${index}`
    );
  }

  return text.slice(index + 1, endIndex);
}

/** Base class for tokens. */
class Token {
  /**
   * @param {number} position Position of the token in the original string
   */
  constructor(position) {
    this.position = position;
  }
}

class NumberToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {number} value Must be a nonnegative integer.
   */
  constructor(position, value) {
    super(position);
    this.value = value;
  }
}

class IdentifierToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} value Name of the identifier
   */
  constructor(position, value) {
    super(position);
    this.value = value;
  }
}

class ReferenceToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} value Name of a skill, missile, or stat
   */
  constructor(position, value) {
    super(position);
    this.value = value;
  }
}

class OperatorToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} operator
   */
  constructor(position, operator) {
    super(position);
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
