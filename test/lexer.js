"use strict";

// Explicit type annotation is needed to suppress TypeScript error.
// See https://stackoverflow.com/a/59229771/ for more information.
/** @type {import("assert").strict} */
const assert = require("assert").strict;

const tokenize = require("../src/lexer.js");

const {
  ClosingParenthesisToken,
  ColonToken,
  CommaToken,
  DotToken,
  IdentifierToken,
  NumberToken,
  OpeningParenthesisToken,
  OperatorToken,
  QuestionMarkToken,
  ReferenceToken,
} = tokenize;

describe("tokenize()", () => {
  it("should tokenize empty string to nothing", () => {
    assert.deepStrictEqual(tokenize(""), []);
  });

  it("should tokenize blank string to nothing", () => {
    assert.deepStrictEqual(tokenize(" "), []);
    assert.deepStrictEqual(tokenize("    "), []);
  });

  it("should tokenize numbers", () => {
    assert.deepStrictEqual(tokenize("0"), [new NumberToken(0, 0)]);
    assert.deepStrictEqual(tokenize("369"), [new NumberToken(0, 369)]);
  });

  it("should tokenize operators", () => {
    assert.deepStrictEqual(tokenize("+"), [new OperatorToken(0, "+")]);
    assert.deepStrictEqual(tokenize("-"), [new OperatorToken(0, "-")]);
    assert.deepStrictEqual(tokenize("*"), [new OperatorToken(0, "*")]);
    assert.deepStrictEqual(tokenize("/"), [new OperatorToken(0, "/")]);

    assert.deepStrictEqual(tokenize("=="), [new OperatorToken(0, "==")]);
    assert.deepStrictEqual(tokenize("!="), [new OperatorToken(0, "!=")]);

    assert.deepStrictEqual(tokenize("<"), [new OperatorToken(0, "<")]);
    assert.deepStrictEqual(tokenize(">"), [new OperatorToken(0, ">")]);
    assert.deepStrictEqual(tokenize("<="), [new OperatorToken(0, "<=")]);
    assert.deepStrictEqual(tokenize(">="), [new OperatorToken(0, ">=")]);
  });

  it("should tokenize parentheses", () => {
    assert.deepStrictEqual(tokenize("("), [new OpeningParenthesisToken(0)]);
    assert.deepStrictEqual(tokenize(")"), [new ClosingParenthesisToken(0)]);
  });

  it("should tokenize symbols", () => {
    assert.deepStrictEqual(tokenize("."), [new DotToken(0)]);
    assert.deepStrictEqual(tokenize(","), [new CommaToken(0)]);
    assert.deepStrictEqual(tokenize("?"), [new QuestionMarkToken(0)]);
    assert.deepStrictEqual(tokenize(":"), [new ColonToken(0)]);
  });

  it("should tokenize identifiers", () => {
    assert.deepStrictEqual(tokenize("min"), [new IdentifierToken(0, "min")]);
    assert.deepStrictEqual(tokenize("ln12"), [new IdentifierToken(0, "ln12")]);
    assert.deepStrictEqual(tokenize("Foo3"), [new IdentifierToken(0, "Foo3")]);
  });

  it("should tokenize references", () => {
    assert.deepStrictEqual(tokenize("''"), [new ReferenceToken(0, "")]);
    assert.deepStrictEqual(tokenize("'skill name'"), [
      new ReferenceToken(0, "skill name"),
    ]);
  });

  it("should ignore whitespace around tokens", () => {
    assert.deepStrictEqual(tokenize(" 1 "), [new NumberToken(1, 1)]);
    assert.deepStrictEqual(tokenize("  +    "), [new OperatorToken(2, "+")]);
    assert.deepStrictEqual(tokenize("  ==  "), [new OperatorToken(2, "==")]);
    assert.deepStrictEqual(tokenize("  (  )  "), [
      new OpeningParenthesisToken(2),
      new ClosingParenthesisToken(5),
    ]);
    assert.deepStrictEqual(tokenize(" lvl > 2 ? lvl + 3 : 0 "), [
      new IdentifierToken(1, "lvl"),
      new OperatorToken(5, ">"),
      new NumberToken(7, 2),
      new QuestionMarkToken(9),
      new IdentifierToken(11, "lvl"),
      new OperatorToken(15, "+"),
      new NumberToken(17, 3),
      new ColonToken(19),
      new NumberToken(21, 0),
    ]);
  });
});
