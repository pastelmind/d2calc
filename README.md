# d2calc

d2calc is an interpreter for the mini-language used internally by [Diablo 2].

Diablo 2 uses text files containing [tab-separated values] to store game data.
These text files contain many formulae that control how various skills operate.
The syntax of the formulae is similar to the C language, with a few extensions.

[Diablo 2]: https://en.wikipedia.org/wiki/Diablo_II
[tab-separated values]: https://en.wikipedia.org/wiki/Tab-separated_values

## Reference: The Formula Mini-Language

This section is based on the [Formulae Guide] from the [Phrozen Keep].

[Formulae Guide]: https://d2mods.info/forum/kb/viewarticle?a=371
[Phrozen Keep]: https://d2mods.info/

The mini-language used by Diablo 2 (henceforth "Formula") supports only one
datatype: the signed 32-bit integer (i.e. DWORD).

The syntax, expressed in Extended Backus-Naur Form:

```ebnf
expression = number
           | expression , binary operator , expression
           | unary operator , expression
           | "(" , expression , ")"
           | expression , "?" , expression , ":" , expression
           | identifier
           | identifier , "(" , expression , "," , expression , ")"
           | identifier , "(" , reference , "." , identifier , ")"
           | identifier , "(" , reference , "." , identifier , "." , identifier , ")" ;

number          = digit , { digit } ;
binary operator = "+" | "-" | "*" | "/" | "==" | "!=" | ">" | "<" | ">=" | "<=" ;
unary operator  = "-" ;
reference       = "'" , { character - "'" } , "'" | number ;
identifier      = letter , { letter | digit } ;

character = (* all possible characters *) ;
letter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
       | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
       | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
       | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" ;
digit  = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

An *identifier* is the name of a built-in function or special identifier.

A *reference* is the name of a skill, missile, or stat in the text files,
surrounded by single quotes (`''`). Alternatively, it can be a number
representing the ID of the skill, missile, or stat.

If the interpreter encounters a function that does not exist (e.g. `man()`
instead of `min()`), it returns the second argument.

### Abstract Syntax

```ebnf
expression = number
           | binary operator , expression , expression
           | unary operator , expression
           | expression , expression , expression   (* conditional expression *)
           | identifier
           | function , expression , expression
           | function , ( reference | number ) , identifier , [ identifier ] ;
```
