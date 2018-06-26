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
const f5 = getTestFunction("5");
const f6 = getTestFunction("6");

describe("undoable tests", () => {
	beforeEach(() => {
		testString = "";
		undoable.reset();
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

		it("inserting a new item clears the redo stack", () => {
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
			undoable.insert({
				undo: f5,
				redo: f6
			});
			undoable.redo();
			expect(testString).toBe("3");
			undoable.undo();
			undoable.undo();
			expect(testString).toBe("351");
		});
	});

	it("handles stack size limit correctly", () => {
		undoable.configure({
			stackLimit: 2
		});

		undoable.insert({
			undo: f1,
			redo: f2
		});
		undoable.insert({
			undo: f3,
			redo: f4
		});
		undoable.insert({
			undo: f3,
			redo: f4
		});
		undoable.undo();
		undoable.undo();
		undoable.undo();
		expect(testString).toBe("33");
		undoable.redo();
		undoable.redo();
		undoable.redo();
		expect(testString).toBe("3344");

		undoable.configure({
			stackLimit: 1
		});
		testString = "";
		undoable.undo();
		undoable.undo();
		expect(testString).toBe("3");
	});
});