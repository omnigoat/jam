

//=====================================================================
// ARRAY
//=====================================================================

// constructors
(function(){
	var A = jam.Array(1, 2);
	jam.assert(A[0] === 1 && A[1] === 2, "constructor doesn't work!");

	A = jam.Array([1, 2]);
	jam.assert(A[0] === 1 && A[1] === 2, "constructor doesn't work!");	
})();

// equality
(function() {
	var a1 = jam.Array(1, 2, 3, 4, 5),
	    a2 = jam.Array(1, 2, 3, 4, 5)
	    ;

	jam.assert( jam.arrays_equal(a1, a2), "equality does not work!" );
})();




