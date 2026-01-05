import { expect, test, describe } from "bun:test"

import { extractArgs } from "../app/utils"



describe("extractArgs", () => {
  describe("single quoted args", () => {

    describe("single quoted strings preserve spaces", () => {
      test("'x...' => single argument with content", () => {
        expect(extractArgs("'hello world'")).toEqual(["hello world"]);
      });

      test("'x x x x' => single argument with multiple spaces", () => {
        expect(extractArgs("'foo bar baz qux'")).toEqual(["foo bar baz qux"]);
      });
    });

    describe("unquoted strings split on spaces", () => {
      test("x x x x => four separate arguments", () => {
        expect(extractArgs("foo bar baz qux")).toEqual(["foo", "bar", "baz", "qux"]);
      });

      test("x    x => two arguments (multiple spaces collapsed)", () => {
        expect(extractArgs("foo    bar")).toEqual(["foo", "bar"]);
      });

      test("x x => two arguments with trailing space", () => {
        expect(extractArgs("foo bar  ")).toEqual(["foo", "bar"]);
      });
    });

    describe("multiple quoted strings", () => {
      test("'x' 'x' => two separate arguments", () => {
        expect(extractArgs("'hello' 'world'")).toEqual(["hello", "world"]);
      });
    });

    describe("adjacent quoted strings concatenate", () => {
      test("'x...''x...' => concatenated into single argument", () => {
        expect(extractArgs("'hello''world'")).toEqual(["helloworld"]);
      });

      test("x...''x... => unquoted followed by quoted concatenates", () => {
        expect(extractArgs("hello''world")).toEqual(["helloworld"]);
      });

      test("'x...'x'x...' => three adjacent parts concatenate", () => {
        expect(extractArgs("'hello'w'orld'")).toEqual(["helloworld"]);
      });
    });

    describe("mixed quoted and unquoted with spaces", () => {
      test("'x...' x 'x...' => three separate arguments", () => {
        expect(extractArgs("'hello' foo 'world'")).toEqual(["hello", "foo", "world"]);
      });

      test("'x...'x 'x...' => two arguments (first concatenated, second separate)", () => {
        expect(extractArgs("'hello'foo 'world'")).toEqual(["hellofoo", "world"]);
      });
    });

    describe("unquoted followed by quoted concatenates", () => {
      test("x'x...' => concatenated into single argument", () => {
        expect(extractArgs("hello'world'")).toEqual(["helloworld"]);
      });
    });

    describe("edge cases", () => {
      test("empty string => empty array", () => {
        expect(extractArgs("")).toEqual([]);
      });

      test("only spaces => empty array", () => {
        expect(extractArgs("   ")).toEqual([]);
      });

      test("single unquoted word => single argument", () => {
        expect(extractArgs("hello")).toEqual(["hello"]);
      });

      test("empty quotes => empty string argument", () => {
        expect(extractArgs("''")).toEqual([""]);
      });

      test("mixed empty and non-empty quotes", () => {
        expect(extractArgs("'hello' '' 'world'")).toEqual(["hello", "", "world"]);
      });
    });
  });


  describe("double quoted args", () => {
    describe("collapses spaces within dquotes", () => {
      test('"hello    world" => ["hello    world"]', () => {
        expect(extractArgs('"hello    world"')).toEqual(["hello    world"]);
      });
    });

    describe("concatenates adjacent quoted strings", () => {
      test('"hello""world" => ["helloworld"]', () => {
        expect(extractArgs('"hello""world"')).toEqual(["helloworld"]);
      });
    });

    describe("separates quoted strings with space", () => {
      test('"hello" "world" => ["hello", "world"]', () => {
        expect(extractArgs('"hello" "world"')).toEqual(["hello", "world"]);
      });
    });

    describe("preserves apostrophes within dquotes", () => {
      test('"hello\'s world" => ["hello\'s world"]', () => {
        expect(extractArgs('"hello\'s world"')).toEqual(["hello's world"]);
      });
    });
  });


  describe("mixed", () => {
    describe("preserves multiple apostrophes within dquotes", () => {
      test('"hello\'\'\'s world" => ["hello\'\'\'s world"]', () => {
        expect(extractArgs('"hello\'\'\'s world"')).toEqual(["hello'''s world"]);
      });
    });

    describe("preserves double quotes within single quotes", () => {
      test('\'The hero said: "We will win"\' => ["The hero said: "We will win""]', () => {
        expect(extractArgs('\'The hero said: "We will win"\'')).toEqual(['The hero said: "We will win"']);
      });
    });

    // describe("concatenating with single + double quotes", () => {
    //   test('\'hello\'\'world\'"world"', () => {
    //     expect(extractArgs('\'hello\'\'world\'"world"')).toEqual(['helloworldworld']);
    //   });
    // });
  });

  /**
   * Backslash outside of quotes test cases
   * 
   * three\ \ \ spaces => three   spaces
   * before\     after => before  after
   * test\nexample => testnexample
   * hello\\world => hello\world
   * \'hello\' => 'hello'
   */
  describe("Backslash outside of quotes", () => {
    describe("backslash escapes spaces outside quotes", () => {
      test('three\\ \\ \\ spaces => ["three   spaces"]', () => {
        expect(extractArgs('three\\ \\ \\ spaces')).toEqual(['three   spaces']);
      });
    });

    describe("backslash before spaces collapses to single space", () => {
      test('before\\     after => ["before  after"]', () => {
        expect(extractArgs('before\\     after')).toEqual(['before ', 'after']);
      });
    });

    describe("backslash escapes literal n outside quotes", () => {
      test('test\\nexample => ["testnexample"]', () => {
        expect(extractArgs('test\\nexample')).toEqual(['testnexample']);
      });
    });

    describe("double backslash produces single backslash", () => {
      test('hello\\\\world => ["hello\\world"]', () => {
        expect(extractArgs('hello\\\\world')).toEqual(['hello\\world']);
      });
    });

    describe("backslash escapes single quotes outside quotes", () => {
      test("\\'hello\\' => [\"'hello'\"]", () => {
        expect(extractArgs("\\'hello\\'")).toEqual(["'hello'"]);
      });
    });
  });
});

