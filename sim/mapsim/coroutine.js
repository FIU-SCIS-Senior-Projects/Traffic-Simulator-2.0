function coroutine(f, options) {
    var o = f(options); // instantiate the coroutine
    o.next(); // execute until the first yield
    return function(x) {
        o.next(x);
    }
}

function stopCoroutine(routine)
{
	clearInterval(routine);
}