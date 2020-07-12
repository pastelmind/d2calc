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
    assert.deepStrictEqual(tokenize("0"), [new NumberToken(0)]);
    assert.deepStrictEqual(tokenize("369"), [new NumberToken(369)]);
  });

  it("should tokenize operators", () => {
    assert.deepStrictEqual(tokenize("+"), [new OperatorToken("+")]);
    assert.deepStrictEqual(tokenize("-"), [new OperatorToken("-")]);
    assert.deepStrictEqual(tokenize("*"), [new OperatorToken("*")]);
    assert.deepStrictEqual(tokenize("/"), [new OperatorToken("/")]);

    assert.deepStrictEqual(tokenize("=="), [new OperatorToken("==")]);
    assert.deepStrictEqual(tokenize("!="), [new OperatorToken("!=")]);

    assert.deepStrictEqual(tokenize("<"), [new OperatorToken("<")]);
    assert.deepStrictEqual(tokenize(">"), [new OperatorToken(">")]);
    assert.deepStrictEqual(tokenize("<="), [new OperatorToken("<=")]);
    assert.deepStrictEqual(tokenize(">="), [new OperatorToken(">=")]);
  });

  it("should tokenize parentheses", () => {
    assert.deepStrictEqual(tokenize("("), [new OpeningParenthesisToken()]);
    assert.deepStrictEqual(tokenize(")"), [new ClosingParenthesisToken()]);
  });

  it("should tokenize symbols", () => {
    assert.deepStrictEqual(tokenize("."), [new DotToken()]);
    assert.deepStrictEqual(tokenize(","), [new CommaToken()]);
    assert.deepStrictEqual(tokenize("?"), [new QuestionMarkToken()]);
    assert.deepStrictEqual(tokenize(":"), [new ColonToken()]);
  });

  it("should tokenize identifiers", () => {
    assert.deepStrictEqual(tokenize("min"), [new IdentifierToken("min")]);
    assert.deepStrictEqual(tokenize("ln12"), [new IdentifierToken("ln12")]);
    assert.deepStrictEqual(tokenize("Foo3"), [new IdentifierToken("Foo3")]);
  });

  it("should tokenize references", () => {
    assert.deepStrictEqual(tokenize("''"), [new ReferenceToken("")]);
    assert.deepStrictEqual(tokenize("'skill name'"), [
      new ReferenceToken("skill name"),
    ]);
  });
});
