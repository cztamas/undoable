# miraculous-undo

Simple JS undo-redo utility for simple applications.

It manages an undo-redo stack, but knows nothing about your application state. This makes it extremely general, but suitable only for simple use cases.

## Basic usage
```javascript
const undoable = require("miraculous-undo");

function doSomething() {
// do something your user may want to undo later - e.g. delete something from somewhere...
}

function undoThatThing() {
// undo that thing - e.g. insert it back to its original place...
}

undoable.insert({
  undo: undoThatThing,
  redo: doSomething
});

// somtimes later
undoable.undo(); // this calls the undo function of the last inserted item, if there is any
undoable.redo(); // calls redo on the last undoed item, if there is any
```

The default maximal length of the undo/redo stack is 20 - you can change it like
`undoable.configure({ stackLimit: 42 })`.

## Undoable sessions
You can group operations into sessions - these will be undoed and redoed together.
E.g.
```javascript
const session = undoable.startSession();

undoable.insert({
  undo: () => setBorderTop(42),
  redo:  () => setBorderTop(137)
});

undoable.insert({
  undo: () => setBorderBottom(42),
  redo:  () => setBorderBottom(137)
})

session.close();
```

This way, the change of border-top and border-bottom will be undoed and redoed together, appearing as one operation to the user.


## Event listeners
You can register and deregister listeners for the undo and redo operations - these will be called with an object containing the undo/redo queue length - like `{ undoQueueLength: 1, redoQueueLength: 3 }`.
E.g.
```javascript
// These will be called after every undo and redo operation, respectively...
undoable.on("undo", undoHandler);
undoable.on("redo", redoHandler);

// This deregisters the listener.
undoable.deregisterListener("undo", undoHandler);
```
