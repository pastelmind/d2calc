import { strict as assert } from "assert";

import tokenize, {
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
} from "../src/lexer.js";
import { D2FSyntaxError } from "../src/errors.js";

/**
 * @typedef {import("../src/lexer.js").Token} Token
 */

/**
 * Verifies that the given code is tokenized to the given token sequence.
 * Helper method for running Mocha tests.
 *
 * @param {string} code
 * @param {Token[]} tokens
 */
function itTokenizesTo(code, tokens) {
  it(`Test "${code}"`, () => {
    assert.deepStrictEqual(tokenize(code), tokens);
  });
}

/**
 * Verifies that `tokenize()` throws while processing the given code.
 *
 * @param {string} code
 * @param {RegExp | Function | object} expectedError
 */
function itFailsTokenizeWith(code, expectedError) {
  it(`Test "${code}"`, () => {
    assert.throws(() => tokenize(code), expectedError);
  });
}

describe("tokenize()", () => {
  describe("should tokenize empty string to nothing", () => {
    itTokenizesTo("", []);
  });

  describe("should tokenize blank string to nothing", () => {
    itTokenizesTo(" ", []);
    itTokenizesTo("    ", []);
  });

  describe("should tokenize numbers", () => {
    itTokenizesTo("0", [new NumberToken(0, "0", 0)]);
    itTokenizesTo("369", [new NumberToken(0, "369", 369)]);
  });

  describe("should tokenize operators", () => {
    itTokenizesTo("+", [new OperatorToken(0, "+")]);
    itTokenizesTo("-", [new OperatorToken(0, "-")]);
    itTokenizesTo("*", [new OperatorToken(0, "*")]);
    itTokenizesTo("/", [new OperatorToken(0, "/")]);

    itTokenizesTo("==", [new OperatorToken(0, "==")]);
    itTokenizesTo("!=", [new OperatorToken(0, "!=")]);

    itTokenizesTo("<", [new OperatorToken(0, "<")]);
    itTokenizesTo(">", [new OperatorToken(0, ">")]);
    itTokenizesTo("<=", [new OperatorToken(0, "<=")]);
    itTokenizesTo(">=", [new OperatorToken(0, ">=")]);
  });

  describe("should tokenize parentheses", () => {
    itTokenizesTo("(", [new OpeningParenthesisToken(0)]);
    itTokenizesTo(")", [new ClosingParenthesisToken(0)]);
  });

  describe("should tokenize symbols", () => {
    itTokenizesTo(",", [new CommaToken(0)]);
    itTokenizesTo("?", [new QuestionMarkToken(0)]);
    itTokenizesTo(":", [new ColonToken(0)]);
  });

  describe("should tokenize identifiers", () => {
    itTokenizesTo("min", [new IdentifierToken(0, "min")]);
    itTokenizesTo("ln12", [new IdentifierToken(0, "ln12")]);
    itTokenizesTo("Foo3", [new IdentifierToken(0, "Foo3")]);
  });

  describe("should tokenize references", () => {
    itTokenizesTo("''", [new ReferenceToken(0, "''", "")]);
    itTokenizesTo("'skill name'", [
      new ReferenceToken(0, "'skill name'", "skill name"),
    ]);
  });

  describe("should tokenize dot codes", () => {
    itTokenizesTo(".code", [new DotCodeToken(0, ".code", "code")]);
  });

  describe("should ignore whitespace around tokens", () => {
    itTokenizesTo(" 1 ", [new NumberToken(1, "1", 1)]);
    itTokenizesTo("  +    ", [new OperatorToken(2, "+")]);
    itTokenizesTo("  ==  ", [new OperatorToken(2, "==")]);
    itTokenizesTo("  (  )  ", [
      new OpeningParenthesisToken(2),
      new ClosingParenthesisToken(5),
    ]);
    itTokenizesTo(" lvl > 2 ? lvl + 3 : 0 ", [
      new IdentifierToken(1, "lvl"),
      new OperatorToken(5, ">"),
      new NumberToken(7, "2", 2),
      new QuestionMarkToken(9),
      new IdentifierToken(11, "lvl"),
      new OperatorToken(15, "+"),
      new NumberToken(17, "3", 3),
      new ColonToken(19),
      new NumberToken(21, "0", 0),
    ]);
  });

  describe("should reject invalid tokens", () => {
    // Invalid symbols
    itFailsTokenizeWith("&", D2FSyntaxError);
    itFailsTokenizeWith("^", D2FSyntaxError);
    itFailsTokenizeWith("!", D2FSyntaxError);
    itFailsTokenizeWith("%", D2FSyntaxError);
    itFailsTokenizeWith(";", D2FSyntaxError);
    itFailsTokenizeWith("~", D2FSyntaxError);
    itFailsTokenizeWith("`", D2FSyntaxError);
    itFailsTokenizeWith("$", D2FSyntaxError);
    itFailsTokenizeWith("_", D2FSyntaxError);
    itFailsTokenizeWith("{", D2FSyntaxError);
    itFailsTokenizeWith("}", D2FSyntaxError);
    itFailsTokenizeWith("[", D2FSyntaxError);
    itFailsTokenizeWith("]", D2FSyntaxError);
    itFailsTokenizeWith("=", D2FSyntaxError);

    // Malformed tokens
    itFailsTokenizeWith("123a", D2FSyntaxError);
    itFailsTokenizeWith("0x1000", D2FSyntaxError);
    itFailsTokenizeWith("'missing closing single-quote", D2FSyntaxError);
    itFailsTokenizeWith("missing opening single-quote'", D2FSyntaxError);
    itFailsTokenizeWith('"foo"', D2FSyntaxError);
  });
});
