# d2calc

[![Build/Test/Lint](https://github.com/pastelmind/d2calc/actions/workflows/build.yml/badge.svg)](https://github.com/pastelmind/d2calc/actions/workflows/build.yml) [![npm](https://img.shields.io/npm/v/d2calc)](https://www.npmjs.com/package/d2calc)

d2calc is an interpreter for the mini-language used internally by [Diablo 2].

Diablo 2 uses text files containing [tab-separated values] to store game data.
These text files contain many formulae that control how various skills operate.
The syntax of the formulae is similar to the C language, with some differences.
For convenience, we will refer to this language as **D2F**.

[diablo 2]: https://en.wikipedia.org/wiki/Diablo_II
[tab-separated values]: https://en.wikipedia.org/wiki/Tab-separated_values

## Installing

d2calc requires Node.js 12 or above. It _should_ be possible to use it in
Node.js 10.x, but no guarantees are given.

For use in Node.js:

```sh
npm install d2calc
```

For use in web browsers, minified versions are also available in UMD and ESM
formats. Check out the [Releases] page for details.

[releases]: https://github.com/pastelmind/d2calc/releases/

## Usage

d2calc exports a function named `interpret()`. It can be used like this:

```js
const { interpret } = require("d2calc");
const result = interpret("4 * (-2 + 25)"); // 92
```

Or, with a custom environment object:

```js
const { interpret } = require("d2calc");
const environment = {
  identifiers: {
    lvl: 3,
    ln12: () => {
      /* Do something here */
    },
  },
  functions: {
    max: (a, b) => Math.max(a, b),
    min: (a, b) => Math.min(a, b),
  },
  referenceFunctions: {
    stat: (ref, code) => {
      /* Do something here */
    },
  },
};

// Calls the stat() and max() functions in the environment
const result = interpret("min(lvl * 2560, stat('hp'.accr))", environment);
```

d2calc also provides a `CachedInterpreter` class. This class caches the
intermediate result of parsing the code. When the same code is interpreted
later, it skips the parsing process, speeding up the result significantly.

```js
const { CachedInterpreter } = require("d2calc");
const interpreter = new CachedInterpreter();

const result = interpreter.interpret("-(125 + 12 * 3 - 2) / 3");
```

d2calc can also be imported inside ECMAScript modules:

```js
// In Node.js >= 12.x, inside an ECMAScript module:
import { interpret } from "d2calc";

// In Node.js <= 10.x, inside an ECMAScript module:
import d2calc from "d2calc";
const { interpret } = d2calc;
```

## API Reference

### `interpret(code[, environment]) => number`

Interprets the `code` using the `environment` and returns the result.

#### Parameters:

##### `code`

- Type: `string`
- Required: Yes

D2F code to interpret.

##### `environment`

- Type: `object`
- Required: No

An object representing the environment to use while interpreting the code.

The object may contain the following fields:

##### `environment.identifiers`

- Type:
  ```ts
  {
    [name: string]: number | () => number;
  }
  ```
- Required: No

An object that maps each identifier name to its value. Each value can be either
a `number`, or a function that takes no arguments and returns a `number`.

##### `environment.functions`

- Type:
  ```ts
  {
    [name: string]: (a: number, b: number) => number;
  }
  ```
- Required: No

An object that maps each numeric function name to a numeric function. Each
numeric function must take two numbers as arguments and return a number.

##### `environment.referenceFunctions`

- Type:
  ```ts
  {
    [name: string]: (ref: string | number, code: string) => number;
  }
  ```
- Required: No

An object that maps each function name to a single-qualifier reference function.
Each reference function must take two arguments: a reference (`string` or
`number`), and a qualifier code (`string`). It must return a number.

##### `environment.referenceFunctions2Q`

- Type:
  ```ts
  {
    [name: string]: (ref: string | number, code1: string, code2: string) => number;
  }
  ```
- Required: No

An object that maps each function name to a double-qualifier reference function.
Each reference function must take three arguments: a reference (`string` or
`number`), and two qualifier codes (`string`). It must return a number.

### `CachedInterpreter`

A class that caches the abstract syntax tree (AST) of the code it interprets.
When the same code is interpreted again, it will use the cached AST instead.
Note that return values of identifiers and functions in the `environment` are
NOT cached.

To free the memory used by the cache, simply delete the interpreter object.

#### `CachedInterpreter.interpret(code[, environment]) => number`

See [`interpret()`] for details.

[`interpret()`]: #interpretcode-environment--number

### Exceptions

d2calc throws a family of exceptions, depending on the nature of the error. Each
exception class can be imported like this:

```js
const { D2FSyntaxError, D2FInterpreterError } = require("d2calc");
```

The exception hierarchy:

- `D2CalcError`: Base class for all exceptions thrown by this package.
  - `D2FError`: Base class for all exceptions caused by a D2F code error.
    - `D2FInterpreterError`: Thrown if the code contains no syntax errors, but cannot be interpreted because it uses an identifier or function in an incorrect way.
    - `D2FSyntaxError`: Thrown if the code contains a syntax error.
  - `D2CalcInternalError`: Used internally for catching bugs. This exception is not intended to be catched by users.

## D2F Language Reference

This section is based on the [Formulae Guide] from the [Phrozen Keep], as well
as [my own research](https://github.com/pastelmind/d2test/tree/test/operators).

[formulae guide]: https://d2mods.info/forum/kb/viewarticle?a=371
[phrozen keep]: https://d2mods.info/

The mini-language used by Diablo 2 (henceforth "D2F") supports only one
datatype: the signed 32-bit integer (i.e. DWORD).

### Tokens

D2F supports the following tokens:

```ebnf
(* Tokens *)
operator   = "+" | "-" | "*" | "/" | "==" | "!=" | ">" | "<" | ">=" | "<=" ;
symbol     = "(" | ")" | "?" | ":" | "," ;
identifier = letter, { letter | digit } ;
reference  = "'" , { character - "'" } , "'";
dot code   = "." , identifier ;

(* Character classes *)
character = (* All possible characters *) ;
letter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
       | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
       | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
       | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" ;
digit  = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

An _identifier_ is the name of a built-in function or a qualifier.

A _reference_ is the name of a skill, missile, or stat in the text files,
surrounded by single quotes (`''`).

A _dot code_ is a single dot (`.`) immediately followed by a qualifier name.

A _qualifier_ is an identifier associated with a skill, missile, or stat.
Each qualifier represents a value in a text file, an in-game property, or a
computed value.

- Qualifiers for skills are defined in `SkillCalc.txt`.
- Qualifiers for missiles are defined in `MissCalc.txt`.
- Stats have the following built-in qualifiers: `base`, `accr`, `mod`

### Expressions

Expressions are formed by joining tokens. Each token can be preceded or followed
by zero or more whitespace characters.

```ebnf
expression  = unary , { operator , unary } ;
unary       = [ "-" ] , conditional ;
conditional = primary , { "?" , primary , ":" , primary } ;
primary     = number
            | "(" , expression , ")"
            | identifier
            | identifier , "(" , arguments , ")" ;
arguments   = ( reference | primary ) , dot code , [ dot code ]
            | expression , "," , expression ;
```

### Operator Precedence

Operators in D2F can be grouped by precedence, from highest to lowest:

1. Parentheses
2. Conditional expressions (`a ? b : c`)
3. Unary negative operator (`-`)
4. Multiplicative operator: `*`, `/`
5. Additive operator: `+`, `-`
6. Comparison operator: `==`, `!=`, `>`, `<`, `>=`, `<=`

Binary operators in the same group are left-associative. Conditional expressions
are also left-associative.

The production rules above can be rewritten in left-recursive form to accurately
reflect associativity and operator precedence:

```ebnf
expression     = expression , comparison operator , additive
               | additive ;
additive       = additive , ( "+" | "-" ) , multiplicative
               | multiplicative ;
multiplicative = multiplicative , ( "*" | "/" ) , unary
               = unary ;
unary          = [ "-" ] , conditional ;
conditional    = conditional , "?" , primary , ":" , primary
               | primary ;

comparison operator = "==" | "!=" | ">" | "<" | ">=" | "<=" ;
```

Note that this form is unsuitable for recursive-descent parsing.

### Abstract Syntax

```ebnf
expression = number
           | expression , binary operator , expression
           | unary operator , expression
           | expression , expression , expression   (* conditional *)
           | identifier
           | function , expression , expression
           | function , ( reference | expression ) , identifier , [ identifier ] ;
```

### Interpreter Quirks

If Diablo 2 encounters a function that does not exist (e.g. `man()` instead of
`min()`), it returns the second argument. d2calc does not implement this
behavior, and instead throws a `D2FInterpreterError`.
