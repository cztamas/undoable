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
		undoable.enable();
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
		undoable.insert({
			undo: f1,
			redo: f2
		});
		undoable.insert({
			undo: f5,
			redo: f6
		});
		undoable.undo();
		undoable.undo();
		expect(testString).toBe("35");
	});

	describe("error handling", () => {
		beforeEach(() => {
			undoable.configure({
				throwError: true
			});
		});

		it("invalid stack limit", () => {
			expect(() => undoable.configure({
				stackLimit: "beer"
			})).toThrow();
		});

		it("insert invalid item", () => {
			expect(() => {
				undoable.insert();
			}).toThrow();
			expect(() => {
				undoable.insert({});
			}).toThrow();
			expect(() => {
				undoable.insert({
					undo: 42
				});
			}).toThrow();
			expect(() => {
				undoable.insert({
					undo: () => {},
					redo: 137
				});
			}).toThrow();
		});

		it("throwing errors can be disabled", () => {
			undoable.configure({
				throwError: false
			});
			expect(() => {
				undoable.insert();
			}).not.toThrow();
		});

		it("closing a session twice", () => {
			const session = undoable.startSession();
			session.close();
			expect(() => session.close()).toThrow();
		});
	});

	describe("sessions", () => {
		beforeEach(() => {
			undoable.configure({
				throwError: true
			});
		});

		it("basic session handling", () => {
			const session = undoable.startSession();
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.insert({
				undo: f3,
				redo: f4
			});
			session.close();
			undoable.undo();
			expect(testString).toBe("31");
			undoable.undo();
			expect(testString).toBe("31");
			undoable.redo();
			expect(testString).toBe("3124");
			undoable.redo();
			expect(testString).toBe("3124");
		});

		it("cannot undo/redo during an open session", () => {
			const session = undoable.startSession();
			undoable.insert({
				undo: f1,
				redo: f2
			});

			expect(() => undoable.undo()).toThrow();
			expect(() => undoable.redo()).toThrow();
			
			undoable.configure({
				throwError: false
			});

			undoable.undo();
			undoable.redo();

			expect(testString).toBe("");
			
			undoable.configure({
				throwError: true
			});

			session.close();
			expect(() => undoable.undo()).not.toThrow();
			expect(() => undoable.redo()).not.toThrow();
		});

		it("roll back a session", () => {
			undoable.startSession();
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.insert({
				undo: f3,
				redo: f4
			});
			undoable.rollbackSessions();
			expect(testString).toBe("31");
			undoable.undo();
			undoable.redo();
			expect(testString).toBe("31");
		});
	});

	describe("enable/disable", () => {
		it("can be disabled", () => {
			undoable.disable();
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.undo();
			undoable.redo();
			expect(testString).toBe("");
		});

		it("can be enabled again", () => {
			undoable.disable();
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.undo();
			undoable.redo();
			expect(testString).toBe("");

			undoable.enable();
			undoable.insert({
				undo: f1,
				redo: f2
			});
			undoable.undo();
			undoable.redo();
			expect(testString).toBe("12");
		});
	});
});