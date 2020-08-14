import { strict as assert } from "assert";

import { D2FSyntaxError } from "../src/errors.js";
import { isInt32 } from "../src/int32.js";
import parse, {
  AstBinaryOp,
  AstConditional,
  AstFunctionCall,
  AstIdentifier,
  AstNumber,
  AstRefFunctionCall,
  AstUnaryOp,
} from "../src/parser.js";

/**
 * @typedef {import("../src/int32.js").Int32} Int32
 * @typedef {import("../src/parser.js").AstExpression} AstExpression
 */

/**
 * Helper method that creates an AstNumber object from a number.
 *
 * @param {number} n
 * @return {AstNumber}
 */
function makeAstNumber(n) {
  assert.ok(isInt32(n), `Invalid test input: ${n} is not Int32`);
  return new AstNumber(n);
}

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
    itParsesTo("5", makeAstNumber(5));
    itParsesTo("494", makeAstNumber(494));
  });

  describe("should parse identifiers correctly", () => {
    itParsesTo("edmx", new AstIdentifier("edmx"));
    itParsesTo("foobar", new AstIdentifier("foobar"));
  });

  describe("should parse binary operators correctly", () => {
    itParsesTo(
      "1 + 2",
      new AstBinaryOp("+", makeAstNumber(1), makeAstNumber(2))
    );
    itParsesTo(
      "len / 25",
      new AstBinaryOp("/", new AstIdentifier("len"), makeAstNumber(25))
    );
    itParsesTo(
      "30 == blvl",
      new AstBinaryOp("==", makeAstNumber(30), new AstIdentifier("blvl"))
    );
  });

  describe("should parse binary operators left-associatively", () => {
    itParsesTo(
      "1 + 2 + 3",
      new AstBinaryOp(
        "+",
        new AstBinaryOp("+", makeAstNumber(1), makeAstNumber(2)),
        makeAstNumber(3)
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
          makeAstNumber(25)
        ),
        new AstIdentifier("clc1")
      )
    );
    itParsesTo(
      "12 == 34 != 56",
      new AstBinaryOp(
        "!=",
        new AstBinaryOp("==", makeAstNumber(12), makeAstNumber(34)),
        makeAstNumber(56)
      )
    );
  });

  describe("should respect precedence of binary operators", () => {
    itParsesTo(
      "25 + 2 * 9",
      new AstBinaryOp(
        "+",
        makeAstNumber(25),
        new AstBinaryOp("*", makeAstNumber(2), makeAstNumber(9))
      )
    );
    itParsesTo(
      "4 + value < 5 * 12 - 1",
      new AstBinaryOp(
        "<",
        new AstBinaryOp("+", makeAstNumber(4), new AstIdentifier("value")),
        new AstBinaryOp(
          "-",
          new AstBinaryOp("*", makeAstNumber(5), makeAstNumber(12)),
          makeAstNumber(1)
        )
      )
    );
  });

  describe("should parse unary operators correctly", () => {
    itParsesTo("-1", new AstUnaryOp("-", makeAstNumber(1)));
    itParsesTo("- dm34", new AstUnaryOp("-", new AstIdentifier("dm34")));
  });

  describe("should respect precedence of unary and binary operators", () => {
    itParsesTo(
      "-44 + - 9",
      new AstBinaryOp(
        "+",
        new AstUnaryOp("-", makeAstNumber(44)),
        new AstUnaryOp("-", makeAstNumber(9))
      )
    );
    itParsesTo(
      "- elen <= - 34",
      new AstBinaryOp(
        "<=",
        new AstUnaryOp("-", new AstIdentifier("elen")),
        new AstUnaryOp("-", makeAstNumber(34))
      )
    );
  });

  describe("should parse parentheses correctly", () => {
    itParsesTo("(4)", makeAstNumber(4));
    itParsesTo(
      "(25 + 2) * 9",
      new AstBinaryOp(
        "*",
        new AstBinaryOp("+", makeAstNumber(25), makeAstNumber(2)),
        makeAstNumber(9)
      )
    );
    itParsesTo(
      "-((elen + (1000 >= 999)) * 9)",
      new AstUnaryOp(
        "-",
        new AstBinaryOp(
          "*",
          new AstBinaryOp(
            "+",
            new AstIdentifier("elen"),
            new AstBinaryOp(">=", makeAstNumber(1000), makeAstNumber(999))
          ),
          makeAstNumber(9)
        )
      )
    );
  });

  describe("should parse conditional expressions correctly", () => {
    itParsesTo(
      "lvl ? 12 : 0",
      new AstConditional(
        new AstIdentifier("lvl"),
        makeAstNumber(12),
        makeAstNumber(0)
      )
    );
  });

  describe("should parse conditional expressions left-associatively", () => {
    itParsesTo(
      "1 ? 2 : 3 ? 4 : 5",
      new AstConditional(
        new AstConditional(
          makeAstNumber(1),
          makeAstNumber(2),
          makeAstNumber(3)
        ),
        makeAstNumber(4),
        makeAstNumber(5)
      )
    );
  });

  describe("should respect precedence of conditional expressions", () => {
    // Unlike most C-alike languages, Diablo 2 gives conditional expressions
    // higher priority than other operators.
    itParsesTo(
      "lvl == 1 + 5 * -3 ? something : 0",
      new AstBinaryOp(
        "==",
        new AstIdentifier("lvl"),
        new AstBinaryOp(
          "+",
          makeAstNumber(1),
          new AstBinaryOp(
            "*",
            makeAstNumber(5),
            new AstUnaryOp(
              "-",
              new AstConditional(
                makeAstNumber(3),
                new AstIdentifier("something"),
                makeAstNumber(0)
              )
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
          makeAstNumber(0),
          makeAstNumber(1),
          makeAstNumber(2)
        ),
        new AstBinaryOp(
          "+",
          new AstBinaryOp("*", new AstIdentifier("lvl"), makeAstNumber(3)),
          makeAstNumber(4)
        )
      )
    );
  });

  describe("should parse function calls correctly", () => {
    itParsesTo(
      "myfunc(2,4)",
      new AstFunctionCall("myfunc", makeAstNumber(2), makeAstNumber(4))
    );
    itParsesTo(
      "max(5 * 2 , min(elen , 3))",
      new AstFunctionCall(
        "max",
        new AstBinaryOp("*", makeAstNumber(5), makeAstNumber(2)),
        new AstFunctionCall("min", new AstIdentifier("elen"), makeAstNumber(3))
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
      new AstRefFunctionCall("func", makeAstNumber(12), "clc1", null)
    );
    itParsesTo(
      "func(foo.bar)",
      new AstRefFunctionCall("func", new AstIdentifier("foo"), "bar", null)
    );
    itParsesTo(
      "temp((5 == 3).woon)",
      new AstRefFunctionCall(
        "temp",
        new AstBinaryOp("==", makeAstNumber(5), makeAstNumber(3)),
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
    itFailsParseWith("", D2FSyntaxError);
  });

  describe("should reject out-of-place tokens", () => {
    itFailsParseWith("1 2", D2FSyntaxError);
    itFailsParseWith("identifier 5", D2FSyntaxError);
    itFailsParseWith("foo bar", D2FSyntaxError);
    itFailsParseWith("12.34", D2FSyntaxError);
    itFailsParseWith("99,00", D2FSyntaxError);
  });

  describe("should reject mismatched parentheses", () => {
    itFailsParseWith("123)", D2FSyntaxError);
    itFailsParseWith("(456", D2FSyntaxError);
    itFailsParseWith("((foo)(", D2FSyntaxError);
    itFailsParseWith("(bar))", D2FSyntaxError);
  });

  describe("should reject invalid operator syntax", () => {
    itFailsParseWith("+25", D2FSyntaxError);
    itFailsParseWith("==", D2FSyntaxError);
    itFailsParseWith("1 + ", D2FSyntaxError);
    itFailsParseWith("== 24", D2FSyntaxError);
    itFailsParseWith("--3", D2FSyntaxError);
    itFailsParseWith("3 <  < 4", D2FSyntaxError);
  });

  describe("should reject out-of-place references", () => {
    itFailsParseWith("'lone reference'", D2FSyntaxError);
    itFailsParseWith("'ref on left' + 12", D2FSyntaxError);
    itFailsParseWith("24 * 'ref on right'", D2FSyntaxError);
  });

  describe("should reject malformed conditional expressions", () => {
    itFailsParseWith("5 ?", D2FSyntaxError);
    itFailsParseWith("? 12", D2FSyntaxError);
    itFailsParseWith("7 : 8", D2FSyntaxError);
    itFailsParseWith("100 :", D2FSyntaxError);
    itFailsParseWith(": 200", D2FSyntaxError);
    itFailsParseWith("cond ? true :", D2FSyntaxError);
    itFailsParseWith("cond ? : false", D2FSyntaxError);
    itFailsParseWith("cond ? 12 + 4 : 5", D2FSyntaxError);
    itFailsParseWith("cond ? -4 : 5", D2FSyntaxError);
    itFailsParseWith("cond ? 4 : -5", D2FSyntaxError);
  });

  describe("should reject malformed function calls", () => {
    itFailsParseWith("(asdf)(12, 5)", D2FSyntaxError);
    itFailsParseWith("2(12, 5)", D2FSyntaxError);
    itFailsParseWith("noclosingparen(12, 5", D2FSyntaxError);

    itFailsParseWith("noargs()", D2FSyntaxError);
    itFailsParseWith("notenoughargs(1)", D2FSyntaxError);
    itFailsParseWith("toomanyargs(1,2,3)", D2FSyntaxError);

    itFailsParseWith("refnotallowed(12,'ref')", D2FSyntaxError);
  });

  describe("should reject malformed reference function calls", () => {
    itFailsParseWith("noclosingparen('ref'.code", D2FSyntaxError);
    itFailsParseWith("noclosingparen('ref'.code1.code2", D2FSyntaxError);

    itFailsParseWith("nodotcode('ref')", D2FSyntaxError);
    itFailsParseWith(
      "toomanydotcodes('ref'.code1.code2.code3)",
      D2FSyntaxError
    );

    itFailsParseWith("funcname('name'. test)", D2FSyntaxError);
    itFailsParseWith("funcname('name'12)", D2FSyntaxError);
  });

  describe("should reject non-primary expressions in reference function calls", () => {
    itFailsParseWith("funcname(1?2:3.test)", D2FSyntaxError);
    itFailsParseWith("funcname(-5.test)", D2FSyntaxError);
    itFailsParseWith("funcname(100*200.test)", D2FSyntaxError);
    itFailsParseWith("funcname(300-400.test)", D2FSyntaxError);
    itFailsParseWith("funcname(500>600.test)", D2FSyntaxError);
  });
});
