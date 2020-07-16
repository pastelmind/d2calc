"use strict";

// Explicit type annotation is needed to suppress TypeScript error.
// See https://stackoverflow.com/a/59229771/ for more information.
/** @type {import("assert").strict} */
const assert = require("assert").strict;

const parse = require("../src/parser.js");

const {
  AstBinaryOp,
  AstConditional,
  AstFunctionCall,
  AstIdentifier,
  AstNumber,
  AstParenthesizedExpression,
  AstPrimaryExpression,
  AstRefFunctionCall,
  AstUnaryOp,
} = parse;

/**
 * Verifies that the given code matches the given AST.
 *
 * @param {string} code
 * @param {AstExpression} ast
 */
function itParsesTo(code, ast) {
  it(`Test "${code}"`, () => {
    assert.deepStrictEqual(parse(code), ast);
  });
}

/**
 * Verifies that `parse()` throws while processing the given code.
 *
 * @param {string} code
 * @param {RegExp | Function | object} expectedError
 */
function itFailsParseWith(code, expectedError) {
  it(`Test "${code}"`, () => {
    assert.throws(() => parse(code), expectedError);
  });
}

describe("parse()", () => {
  describe("should parse numbers correctly", () => {
    itParsesTo("5", new AstNumber(5));
    itParsesTo("494", new AstNumber(494));
  });

  describe("should parse identifiers correctly", () => {
    itParsesTo("edmx", new AstIdentifier("edmx"));
    itParsesTo("foobar", new AstIdentifier("foobar"));
  });

  describe("should parse binary operators correctly", () => {
    itParsesTo(
      "1 + 2",
      new AstBinaryOp("+", new AstNumber(1), new AstNumber(2))
    );
    itParsesTo(
      "len / 25",
      new AstBinaryOp("/", new AstIdentifier("len"), new AstNumber(25))
    );
    itParsesTo(
      "30 == blvl",
      new AstBinaryOp("==", new AstNumber(30), new AstIdentifier("blvl"))
    );
  });

  describe("should parse binary operators left-associatively", () => {
    itParsesTo(
      "1 + 2 + 3",
      new AstBinaryOp(
        "+",
        new AstBinaryOp("+", new AstNumber(1), new AstNumber(2)),
        new AstNumber(3)
      )
    );
    itParsesTo(
      "par3 * par2 / 25 * clc1",
      new AstBinaryOp(
        "*",
        new AstBinaryOp(
          "/",
          new AstBinaryOp(
            "*",
            new AstIdentifier("par3"),
            new AstIdentifier("par2")
          ),
          new AstNumber(25)
        ),
        new AstIdentifier("clc1")
      )
    );
    itParsesTo(
      "12 == 34 != 56",
      new AstBinaryOp(
        "!=",
        new AstBinaryOp("==", new AstNumber(12), new AstNumber(34)),
        new AstNumber(56)
      )
    );
  });

  describe("should respect precedence of binary operators", () => {
    itParsesTo(
      "25 + 2 * 9",
      new AstBinaryOp(
        "+",
        new AstNumber(25),
        new AstBinaryOp("*", new AstNumber(2), new AstNumber(9))
      )
    );
    itParsesTo(
      "4 + value < 5 * 12 - 1",
      new AstBinaryOp(
        "<",
        new AstBinaryOp("+", new AstNumber(4), new AstIdentifier("value")),
        new AstBinaryOp(
          "-",
          new AstBinaryOp("*", new AstNumber(5), new AstNumber(12)),
          new AstNumber(1)
        )
      )
    );
  });

  describe("should parse unary operators correctly", () => {
    itParsesTo("-1", new AstUnaryOp("-", new AstNumber(1)));
    itParsesTo("- dm34", new AstUnaryOp("-", new AstIdentifier("dm34")));
  });

  describe("should respect precedence of unary and binary operators", () => {
    itParsesTo(
      "-44 + - 9",
      new AstBinaryOp(
        "+",
        new AstUnaryOp("-", new AstNumber(44)),
        new AstUnaryOp("-", new AstNumber(9))
      )
    );
    itParsesTo(
      "- elen <= - 34",
      new AstBinaryOp(
        "<=",
        new AstUnaryOp("-", new AstIdentifier("elen")),
        new AstUnaryOp("-", new AstNumber(34))
      )
    );
  });

  describe("should parse parentheses correctly", () => {
    itParsesTo("(4)", new AstParenthesizedExpression(new AstNumber(4)));
    itParsesTo(
      "(25 + 2) * 9",
      new AstBinaryOp(
        "*",
        new AstParenthesizedExpression(
          new AstBinaryOp("+", new AstNumber(25), new AstNumber(2))
        ),
        new AstNumber(9)
      )
    );
    itParsesTo(
      "-((elen + (1000 >= 999)) * 9)",
      new AstUnaryOp(
        "-",
        new AstParenthesizedExpression(
          new AstBinaryOp(
            "*",
            new AstParenthesizedExpression(
              new AstBinaryOp(
                "+",
                new AstIdentifier("elen"),
                new AstParenthesizedExpression(
                  new AstBinaryOp(">=", new AstNumber(1000), new AstNumber(999))
                )
              )
            ),
            new AstNumber(9)
          )
        )
      )
    );
  });

  describe("should parse conditional expressions correctly", () => {
    itParsesTo(
      "lvl ? 12 : 0",
      new AstConditional(
        new AstIdentifier("lvl"),
        new AstNumber(12),
        new AstNumber(0)
      )
    );
  });

  describe("should parse conditional expressions left-associatively", () => {
    itParsesTo(
      "1 ? 2 : 3 ? 4 : 5",
      new AstConditional(
        new AstConditional(
          new AstNumber(1),
          new AstNumber(2),
          new AstNumber(3)
        ),
        new AstNumber(4),
        new AstNumber(5)
      )
    );
  });

  describe("should respect precedence of conditional expressions", () => {
    // Unlike most C-alike languages, Diablo 2 gives conditional expressions
    // higher priority than other operators.
    itParsesTo(
      "lvl == 1 + 5 * 3 ? something : 0",
      new AstBinaryOp(
        "==",
        new AstIdentifier("lvl"),
        new AstBinaryOp(
          "+",
          new AstNumber(1),
          new AstBinaryOp(
            "*",
            new AstNumber(5),
            new AstConditional(
              new AstNumber(3),
              new AstIdentifier("something"),
              new AstNumber(0)
            )
          )
        )
      )
    );
    itParsesTo(
      "0 ? 1 : 2 < lvl * 3 + 4",
      new AstBinaryOp(
        "<",
        new AstConditional(
          new AstNumber(0),
          new AstNumber(1),
          new AstNumber(2)
        ),
        new AstBinaryOp(
          "+",
          new AstBinaryOp("*", new AstIdentifier("lvl"), new AstNumber(3)),
          new AstNumber(4)
        )
      )
    );
  });

  describe("should parse function calls correctly", () => {
    itParsesTo(
      "myfunc(2,4)",
      new AstFunctionCall("myfunc", new AstNumber(2), new AstNumber(4))
    );
    itParsesTo(
      "max(5 * 2 , min(elen , 3))",
      new AstFunctionCall(
        "max",
        new AstBinaryOp("*", new AstNumber(5), new AstNumber(2)),
        new AstFunctionCall("min", new AstIdentifier("elen"), new AstNumber(3))
      )
    );
  });

  describe("should parse reference function calls correctly", () => {
    itParsesTo(
      "name('asdf'.len)",
      new AstRefFunctionCall("name", "asdf", "len", null)
    );
    itParsesTo(
      "func(12.clc1)",
      new AstRefFunctionCall("func", new AstNumber(12), "clc1", null)
    );
    itParsesTo(
      "func(foo.bar)",
      new AstRefFunctionCall("func", new AstIdentifier("foo"), "bar", null)
    );
    itParsesTo(
      "temp((5 == 3).woon)",
      new AstRefFunctionCall(
        "temp",
        new AstParenthesizedExpression(
          new AstBinaryOp("==", new AstNumber(5), new AstNumber(3))
        ),
        "woon",
        null
      )
    );
    itParsesTo(
      "functionName('some skill'.foo.bar)",
      new AstRefFunctionCall("functionName", "some skill", "foo", "bar")
    );
  });

  describe("should reject empty string", () => {
    itFailsParseWith("", Error);
  });

  describe("should reject out-of-place tokens", () => {
    itFailsParseWith("1 2", Error);
    itFailsParseWith("identifier 5", Error);
    itFailsParseWith("foo bar", Error);
    itFailsParseWith("12.34", Error);
    itFailsParseWith("99,00", Error);
  });

  describe("should reject mismatched parentheses", () => {
    itFailsParseWith("123)", Error);
    itFailsParseWith("(456", Error);
    itFailsParseWith("((foo)(", Error);
    itFailsParseWith("(bar))", Error);
  });

  describe("should reject invalid operator syntax", () => {
    itFailsParseWith("+25", Error);
    itFailsParseWith("==", Error);
    itFailsParseWith("1 + ", Error);
    itFailsParseWith("== 24", Error);
    itFailsParseWith("--3", Error);
    itFailsParseWith("3 <  < 4", Error);
  });

  describe("should reject out-of-place references", () => {
    itFailsParseWith("'lone reference'", Error);
    itFailsParseWith("'ref on left' + 12", Error);
    itFailsParseWith("24 * 'ref on right'", Error);
  });

  describe("should reject malformed conditional expressions", () => {
    itFailsParseWith("5 ?", Error);
    itFailsParseWith("? 12", Error);
    itFailsParseWith("7 : 8", Error);
    itFailsParseWith("100 :", Error);
    itFailsParseWith(": 200", Error);
    itFailsParseWith("cond ? true :", Error);
    itFailsParseWith("cond ? : false", Error);
    itFailsParseWith("cond ? 12 + 4 : 5", Error);
    itFailsParseWith("cond ? -4 : 5", Error);
    itFailsParseWith("cond ? 4 : -5", Error);
  });

  describe("should reject malformed function calls", () => {
    itFailsParseWith("(asdf)(12, 5)", Error);
    itFailsParseWith("2(12, 5)", Error);
    itFailsParseWith("noclosingparen(12, 5", Error);

    itFailsParseWith("noargs()", Error);
    itFailsParseWith("notenoughargs(1)", Error);
    itFailsParseWith("toomanyargs(1,2,3)", Error);

    itFailsParseWith("refnotallowed(12,'ref')", Error);
  });

  describe("should reject malformed reference function calls", () => {
    itFailsParseWith("noclosingparen('ref'.code", Error);
    itFailsParseWith("noclosingparen('ref'.code1.code2", Error);

    itFailsParseWith("nodotcode('ref')", Error);
    itFailsParseWith("toomanydotcodes('ref'.code1.code2.code3)", Error);

    itFailsParseWith("funcname('name'. test)", Error);
    itFailsParseWith("funcname('name'12)", Error);
  });

  describe("should reject non-primary expressions in reference function calls", () => {
    itFailsParseWith("funcname(1?2:3.test)", Error);
    itFailsParseWith("funcname(-5.test)", Error);
    itFailsParseWith("funcname(100*200.test)", Error);
    itFailsParseWith("funcname(300-400.test)", Error);
    itFailsParseWith("funcname(500>600.test)", Error);
  });
});
