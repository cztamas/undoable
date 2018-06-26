"use strict";

const defaultStackLimit = 20;

const undoStack = [];
const redoStack = [];
// the currently open sessions...
const sessions = [];
const sessionStack = [];

let stackLimit = defaultStackLimit;
// Whether to throw error or just log invalid operations...
let shouldThrowError = false;
let enabled = true;
let processingUndo = false;

module.exports = {
	undo: undo,
	redo: redo,
	insert: insert,
	startSession: startSession,
	rollBackSessions: rollBackSessions,
	rollbackSessions: rollBackSessions,
	enable: enable,
	disable: disable,
	clear: clear,
	reset: reset,
	configure: configure
};

function insertToStack(item) {
	this.push(item);
	if (this.length > stackLimit) {
		this.shift();
	}
}

function limitStack() {
	if (this.length > stackLimit) {
		this.length = stackLimit;
	}
}

undoStack.insert = insertToStack.bind(undoStack);
undoStack.checkLimit = limitStack.bind(undoStack);

redoStack.insert = insertToStack.bind(redoStack);
redoStack.checkLimit = limitStack.bind(redoStack);

function applyUndo(item) {
	item.undo();
}

function applyRedo(item) {
	item.redo();
}

function itemFromSession() {
	const items = sessionStack.slice();
	const reversed = items.slice().reverse();

	function undo() {
		reversed.forEach(applyUndo);
	}

	function redo() {
		items.forEach(applyRedo);
	}

	return {
		undo: undo,
		redo: redo
	};
}

function insert(item) {
	if (!allowed()) {
		return;
	}
	if (!item || typeof item.undo !== "function" || typeof item.redo !== "function") {
		error("Invalid item");
		return;
	}
	redoStack.length = 0;
	if (sessions.length > 0) {
		sessionStack.push(item);
		return;
	}
	undoStack.insert(item);
}

function undo() {
	if (!allowed()) {
		return;
	}
	if (sessions.length > 0) {
		error("Cannot undo when there is an open session");
		return;
	}
	const item = undoStack.pop();
	if (!item) {
		return;
	}
	processingUndo = true;
	item.undo();
	processingUndo = false;

	redoStack.insert(item);
}

function redo() {
	if (!allowed()) {
		return;
	}
	if (sessions.length > 0) {
		error("Cannot redo when there is an open session");
		return;
	}
	const item = redoStack.pop();
	if (!item) {
		return;
	}
	processingUndo = true;
	item.redo();
	processingUndo = false;

	undoStack.insert(item);
}

function startSession() {
	const session = {};

	session.close = function() {
		closeSession(session);
	};
	sessions.push(session);

	return session;
}

function closeSession(session) {
	const index = sessions.indexOf(session);
	if (index === -1) {
		error("Not an open session");
		return;
	}
	sessions.length = index;
	if (index > 0) {
		return;
	}
	const item = itemFromSession();
	insert(item);
}

function rollBackSessions() {
	if (!sessions.length || !sessionStack.length) {
		return;
	}
	sessionStack.reverse().forEach(function(item) {
		item.undo();
	});
	sessions.length = 0;
	sessionStack.length = 0;
}

function configure(config) {
	const limit = config.stackLimit;
	const throwError = config.shouldThrowError;

	if (limit !== undefined) {
		if (typeof limit !== "number" || parseInt(limit, 10) !== limit || limit <= 0) {
			error("Invalid stackLimit value: " + limit);
		} else {
			stackLimit = limit;
			undoStack.checkLimit();
			redoStack.checkLimit();
		}
	}
	if (throwError !== undefined) {
		shouldThrowError = throwError;
	}
}

function disable() {
	enabled = false;
}

function enable() {
	enabled = true;
}

function clear() {
	sessions.length = 0;
	sessionStack.length = 0;
	undoStack.length = 0;
	redoStack.length = 0;
}

function reset() {
	clear();
	stackLimit = defaultStackLimit;
}

function error(message) {
	if (shouldThrowError) {
		throw new Error(message);
	}
	console.error(message);
}

function allowed() {
	return enabled && !processingUndo;
}
