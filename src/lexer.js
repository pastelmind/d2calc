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
  while (currentPos < text.length) {
    const token = matchTokenAt(text, currentPos);
    let whitespace;

    if (token) {
      tokens.push(token);
      currentPos += token.rawValue.length;
    } else if ((whitespace = matchRegexAt(text, currentPos, /\s+/y)) !== null) {
      currentPos += whitespace.length;
    } else {
      const endPos = currentPos + 10;
      let textShown = text.slice(currentPos, endPos);
      if (endPos < text.length) textShown += "...";
      throw new Error(
        `Cannot parse token at index ${currentPos} of input: "${textShown}"`
      );
    }
  }

  return tokens;
}

/**
 * Attempts to parse a token at a given position.
 *
 * @param {string} text Input code
 * @param {number} index Position to starting parsing
 * @return {Token | null} Parsed token, or null if the token cannot be parsed
 *    (i.e. an invalid character or whitespace).
 */
function matchTokenAt(text, index) {
  const currentCh = text.charAt(index);
  switch (currentCh) {
    case "(":
      return new OpeningParenthesisToken(index);
    case ")":
      return new ClosingParenthesisToken(index);
    case "?":
      return new QuestionMarkToken(index);
    case ":":
      return new ColonToken(index);
    case ",":
      return new CommaToken(index);
    case "+":
    case "-":
      return new AdditiveOperatorToken(index, currentCh);
    case "*":
    case "/":
      return new MultiplicativeOperatorToken(index, currentCh);
  }

  let matchedStr;

  // Comparison operator
  if ((matchedStr = matchRegexAt(text, index, /<=?|>=?|==|!=/y)) !== null) {
    // @ts-ignore: Assigning string to a string literal type
    return new ComparisonOperatorToken(index, matchedStr);
  }
  // Number
  if ((matchedStr = matchRegexAt(text, index, /\d+/y)) !== null) {
    return new NumberToken(index, matchedStr, parseInt(matchedStr));
  }
  // Identifier
  if ((matchedStr = matchIdentifier(text, index)) !== null) {
    return new IdentifierToken(index, matchedStr);
  }
  // Reference
  if ((matchedStr = matchReference(text, index))) {
    return new ReferenceToken(index, matchedStr, matchedStr.slice(1, -1));
  }
  // Dot code
  if ((matchedStr = matchDotCode(text, index))) {
    return new DotCodeToken(index, "." + matchedStr, matchedStr);
  }

  return null;
}

/**
 * Attempts to match a pattern in a string, starting at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @param {RegExp} pattern Must be a sticky pattern
 * @return {string | null}
 */
function matchRegexAt(text, index, pattern) {
  pattern.lastIndex = index;
  const match = pattern.exec(text);
  return match ? match[0] : null;
}

/**
 * Attempts to match an identifier token in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null} The matched identifier token, or `null` on failure.
 */
function matchIdentifier(text, index) {
  return matchRegexAt(text, index, /[a-z]\w*/iy);
}

/**
 * Attempts to match a reference token in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null} If a reference token is successfully matched, returns
 *    the reference string (with the surrounding single-quotes).
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

  return text.slice(index, endIndex + 1);
}

/**
 * Attempts to match a dot code token in a string at the given index.
 *
 * @param {string} text
 * @param {number} index
 * @return {string | null} If a match is found, returns the dot code (without
 *    the leading dot). Otherwise, returns `null`.
 * @throws {Error} If the dot is not followed by a valid code
 */
function matchDotCode(text, index) {
  if (text.charAt(index) !== ".") return null;

  const code = matchIdentifier(text, index + 1);
  if (code === null) {
    throw new Error(
      `Dot (.) is not followed by a valid identifier at index ${index}`
    );
  }

  return code;
}

/** Base class for tokens. */
class Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} rawValue Raw text of the token
   */
  constructor(position, rawValue) {
    this.position = position;
    this.rawValue = rawValue;
  }
}

class NumberToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} rawValue Raw text of the token
   * @param {number} number Must be a nonnegative integer
   */
  constructor(position, rawValue, number) {
    super(position, rawValue);
    this.number = number;
  }
}

class IdentifierToken extends Token {}

class ReferenceToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} rawValue Raw text of the token
   * @param {string} reference Name of a skill, missile, or stat
   */
  constructor(position, rawValue, reference) {
    super(position, rawValue);
    this.reference = reference;
  }
}

class AdditiveOperatorToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {"+" | "-"} operator
   */
  constructor(position, operator) {
    super(position, operator);
    this.operator = operator;
  }
}

class MultiplicativeOperatorToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {"*" | "/"} operator
   */
  constructor(position, operator) {
    super(position, operator);
    this.operator = operator;
  }
}

class ComparisonOperatorToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {"==" | "!=" | "<" | ">" | "<=" | ">="} operator
   */
  constructor(position, operator) {
    super(position, operator);
    this.operator = operator;
  }
}

class OpeningParenthesisToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   */
  constructor(position) {
    super(position, "(");
  }
}
class ClosingParenthesisToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   */
  constructor(position) {
    super(position, ")");
  }
}

/** Token used by function call expressions */
class CommaToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   */
  constructor(position) {
    super(position, ",");
  }
}

/** Token used by reference function call expressions */
class DotCodeToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   * @param {string} rawValue Raw text of the token
   * @param {string} code Qualifier code
   */
  constructor(position, rawValue, code) {
    super(position, rawValue);
    this.code = code;
  }
}

/** Token used by conditional expressions */
class QuestionMarkToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   */
  constructor(position) {
    super(position, "?");
  }
}

/** Token used by conditional expressions */
class ColonToken extends Token {
  /**
   * @param {number} position Position of the token in the original string
   */
  constructor(position) {
    super(position, ":");
  }
}

module.exports = tokenize;
module.exports.Token = Token;
module.exports.NumberToken = NumberToken;
module.exports.IdentifierToken = IdentifierToken;
module.exports.ReferenceToken = ReferenceToken;
module.exports.AdditiveOperatorToken = AdditiveOperatorToken;
module.exports.MultiplicativeOperatorToken = MultiplicativeOperatorToken;
module.exports.ComparisonOperatorToken = ComparisonOperatorToken;
module.exports.OpeningParenthesisToken = OpeningParenthesisToken;
module.exports.ClosingParenthesisToken = ClosingParenthesisToken;
module.exports.CommaToken = CommaToken;
module.exports.DotCodeToken = DotCodeToken;
module.exports.QuestionMarkToken = QuestionMarkToken;
module.exports.ColonToken = ColonToken;
