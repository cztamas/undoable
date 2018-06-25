"use strict";

const undoable = require("./index.js");

let testString = "";
const getTestFunction = text => () => {
	testString += text;
};

const f1 = getTestFunction("1");
const f2 = getTestFunction("2");
const f3 = getTestFunction("3");
const f4 = getTestFunction("4");

describe("undoable tests", () => {
	beforeEach(() => {
		testString = "";
		undoable.clear();
	});

	describe("basic undo/redo", () => {
		it("undo works correctly", () => {
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.insert({
				undo: f3,
				redo: f4
			});
			undoable.undo();
			expect(testString).toBe("3");
			undoable.undo();
			expect(testString).toBe("31");
		});

		it("redo works correctly", () => {
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.insert({
				undo: f3,
				redo: f4
			});
			undoable.undo();
			undoable.undo();
			expect(testString).toBe("31");
			undoable.redo();
			expect(testString).toBe("312");
			undoable.redo();
			expect(testString).toBe("3124");
			undoable.redo();
			expect(testString).toBe("3124");
		});
	});
});