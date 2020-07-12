"use strict";

// Explicit type annotation is needed to suppress TypeScript error.
// See https://stackoverflow.com/a/59229771/ for more information.
/** @type {import("assert").strict} */
const assert = require("assert").strict;

const parse = require("../src/parser.js");

const {
  AstBinaryOp,
  AstConditional,
  AstExpression,
  AstFunctionCall,
  AstIdentifier,
  AstNumber,
  AstReferenceFunctionCall,
  AstUnaryOp,
} = parse;

describe("parse()", () => {
  it("should parse numbers correctly", () => {
    assert.deepStrictEqual(parse("5"), new AstNumber(5));
    assert.deepStrictEqual(parse("494"), new AstNumber(494));
  });

  it("should parse identifiers correctly", () => {
    assert.deepStrictEqual(parse("edmx"), new AstIdentifier("edmx"));
    assert.deepStrictEqual(parse("foobar"), new AstIdentifier("foobar"));
  });

  it("should parse binary operators correctly", () => {
    assert.deepStrictEqual(
      parse("1 + 2"),
      new AstBinaryOp("+", new AstNumber(1), new AstNumber(2))
    );
    assert.deepStrictEqual(
      parse("len / 25"),
      new AstBinaryOp("/", new AstIdentifier("len"), new AstNumber(25))
    );
    assert.deepStrictEqual(
      parse("30 == blvl"),
      new AstBinaryOp("==", new AstNumber(30), new AstIdentifier("blvl"))
    );
  });

  it("should parse binary operators left-associatively", () => {
    assert.deepStrictEqual(
      parse("1 + 2 + 3"),
      new AstBinaryOp(
        "+",
        new AstBinaryOp("+", new AstNumber(1), new AstNumber(2)),
        new AstNumber(3)
      )
    );
    assert.deepStrictEqual(
      parse("par3 * par2 / 25 * clc1"),
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
        )
      ),
      new AstIdentifier("clc1")
    );
    assert.deepStrictEqual(
      parse("12 == 34 != 56"),
      new AstBinaryOp(
        "!=",
        new AstBinaryOp("==", new AstNumber(12), new AstNumber(34)),
        new AstNumber(56)
      )
    );
  });

  it("should respect precedence of binary operators", () => {
    assert.deepStrictEqual(
      parse("25 + 2 * 9"),
      new AstBinaryOp(
        "+",
        new AstNumber(25),
        new AstBinaryOp("*", new AstNumber(2), new AstNumber(9))
      )
    );
    assert.deepStrictEqual(
      parse("4 + value < 5 * 12 - 1"),
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

  it("should parse unary operators correctly", () => {
    assert.deepStrictEqual(parse("+1"), new AstUnaryOp("+", new AstNumber(1)));
    assert.deepStrictEqual(
      parse("- dm34"),
      new AstUnaryOp("-", new AstIdentifier("dm34"))
    );
  });

  it("should respect precedence of unary and binary operators", () => {
    assert.deepStrictEqual(
      parse("-44 + + 9"),
      new AstBinaryOp(
        "+",
        new AstUnaryOp("-", new AstNumber(44)),
        new AstUnaryOp("+", new AstNumber(9))
      )
    );
    assert.deepStrictEqual(
      parse("+ elen <= - 34"),
      new AstBinaryOp(
        "<=",
        new AstUnaryOp("+", new AstIdentifier("elen")),
        new AstUnaryOp("-", new AstNumber(34))
      )
    );
  });

  it("should parse parentheses correctly", () => {
    assert.deepStrictEqual(parse("(4)"), new AstNumber(4));
    assert.deepStrictEqual(
      parse("(25 + 2) * 9"),
      new AstBinaryOp(
        "*",
        new AstBinaryOp("+", new AstNumber(25), new AstNumber(2)),
        new AstNumber(9)
      )
    );
    assert.deepStrictEqual(
      parse("-((elen + (1000 >= 999)) * 9)"),
      new AstUnaryOp(
        "-",
        new AstBinaryOp(
          "*",
          new AstBinaryOp(
            "+",
            new AstIdentifier("elen"),
            new AstBinaryOp(">=", new AstNumber(1000), new AstNumber(999))
          ),
          new AstNumber(9)
        )
      )
    );
  });

  it("should parse conditional expressions correctly", () => {
    assert.deepStrictEqual(
      parse("lvl ? 12 : 0"),
      new AstConditional(
        new AstIdentifier("lvl"),
        new AstNumber(12),
        new AstNumber(0)
      )
    );
  });

  it("should respect associativity of conditional expressions", () => {
    // I don't know if conditional expressions are left-associative in Diablo 2.
    // For now, let's assume that it is right-associative.
    assert.deepStrictEqual(
      parse("1 ? 2 : 3 ? 4 : 5"),
      new AstConditional(
        new AstNumber(1),
        new AstNumber(2),
        new AstConditional(new AstNumber(3), new AstNumber(4), new AstNumber(5))
      )
    );
  });

  it("should respect precedence of conditional expressions", () => {
    // Unlike most C-alike languages, Diablo 2 gives conditional expressions
    // higher priority than other operators.
    assert.deepStrictEqual(
      parse("lvl == 1 + 5 * 3 ? something : 0"),
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
    assert.deepStrictEqual(
      parse("0 ? 1 : 2 * 3 + 4 < lvl"),
      new AstBinaryOp(
        "<",
        new AstBinaryOp(
          "+",
          new AstBinaryOp(
            "*",
            new AstConditional(
              new AstNumber(0),
              new AstNumber(1),
              new AstNumber(2)
            ),
            new AstNumber(3)
          ),
          new AstNumber(4)
        ),
        new AstIdentifier("lvl")
      )
    );
  });

  it("should parse function calls correctly", () => {
    assert.deepStrictEqual(
      parse("myfunc(2,4)"),
      new AstFunctionCall("myfunc", new AstNumber(2), new AstNumber(4))
    );
    assert.deepStrictEqual(
      parse("max(5 * 2 , min(elen , 3))"),
      new AstFunctionCall(
        "max",
        new AstBinaryOp("*", new AstNumber(5), new AstNumber(2)),
        new AstFunctionCall("min", new AstIdentifier("elen"), new AstNumber(3))
      )
    );
  });

  it("should parse reference function calls correctly", () => {
    assert.deepStrictEqual(
      parse("name('asdf'.len)"),
      new AstReferenceFunctionCall("name", "asdf", "len", null)
    );
    assert.deepStrictEqual(
      parse("func(12.clc1)"),
      new AstReferenceFunctionCall("func", 12, "clc1", null)
    );
    assert.deepStrictEqual(
      parse("functionName('some skill'.foo.bar)"),
      new AstReferenceFunctionCall("functionName", "some skill", "foo", "bar")
    );
  });
});
