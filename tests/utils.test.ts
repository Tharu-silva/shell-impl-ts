import { expect, test, describe } from "bun:test"

import { extractArgs } from "../app/utils"



describe("extractArgs", () => {
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

