# d2calc

d2calc is an interpreter for the mini-language used internally by [Diablo 2].

Diablo 2 uses text files containing [tab-separated values] to store game data.
These text files contain many formulae that control how various skills operate.
The syntax of the formulae is similar to the C language, with some differences.
For convenience, we will refer to this language as **D2F**.

[Diablo 2]: https://en.wikipedia.org/wiki/Diablo_II
[tab-separated values]: https://en.wikipedia.org/wiki/Tab-separated_values

## D2F Language Reference

This section is based on the [Formulae Guide] from the [Phrozen Keep], as well
as [my own research](https://github.com/pastelmind/d2test/tree/test/operators).

[Formulae Guide]: https://d2mods.info/forum/kb/viewarticle?a=371
[Phrozen Keep]: https://d2mods.info/

The mini-language used by Diablo 2 (henceforth "D2F") supports only one
datatype: the signed 32-bit integer (i.e. DWORD).

### Tokens

D2F supports the following tokens:

```ebnf
(* Tokens *)
operator   = "+" | "-" | "*" | "/" | "==" | "!=" | ">" | "<" | ">=" | "<=" ;
symbol     = "(" | ")" | "?" | ":" | ","
identifier = letter, { letter | digit } ;
reference  = "'" , { character - "'" } , "'";
dot code   = "." , identifier

(* Character classes *)
character = (* All possible characters *) ;
letter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
       | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
       | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
       | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" ;
digit  = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

An *identifier* is the name of a built-in function or a qualifier.

A *reference* is the name of a skill, missile, or stat in the text files,
surrounded by single quotes (`''`).

A *dot code* is a single dot (`.`) immediately followed by a qualifier name.

A *qualifier* is an identifier associated with a skill, missile, or stat.
Each qualifier represents a value in a text file, an in-game property, or a
computed value.

* Qualifiers for skills are defined in `SkillCalc.txt`.
* Qualifiers for missiles are defined in `MissCalc.txt`.
* Stats have the following built-in qualifiers: `base`, `accr`, `mod`

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

If the interpreter encounters a function that does not exist (e.g. `man()`
instead of `min()`), it returns the second argument.
