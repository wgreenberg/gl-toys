function createMaze (width, height) {
    var M = []; // maze spaces
    var A = []; // adjacencies
    var E = []; // empty spaces
    for (var x=0; x<width; x++) {
        for (var y=0; y<height; y++) {
            E.push([x,y]);
        }
    }

    var start = choose(E);
    M.push(start);

    // Generate a uniform spanning tree via Wilson's Algorithm
    while (E.length > 0) {
        var path = randomPath(M, E);
        M = M.concat(path.nodes);
        A = A.concat(path.adjacencies);
    }

    return stringify(width, height, A);
}

function stringify (width, height, A) {
    var output = [];
    for (var x=0; x<2*width+1; x++) {
        var row = [];
        for (var y=0; y<2*height+1; y++) {
            if (x%2 == 0 || y%2 == 0)
                row.push('1');
            else
                row.push(' ');
        }
        output.push(row);
    }

    A.forEach(function (adj) {
        var a = adj[0];
        var b = adj[1];
        var realA = [a[0] * 2 + 1, a[1] * 2 + 1];
        var realB = [b[0] * 2 + 1, b[1] * 2 + 1];
        var realWall = [];
        // if the x coord didn't change, the wall is horizontal
        if (a[0] === b[0]) {
            realWall[0] = realA[0];
            realWall[1] = Math.min(realA[1], realB[1]) + 1;
        } else {
            realWall[0] = Math.min(realA[0], realB[0]) + 1;
            realWall[1] = realA[1];
        }
        output[realWall[0]][realWall[1]] = ' ';
    });

    // create an opening at the entrance (top left) and exit (bottom right)
    output[1][0] = ' ';
    output[0][0] = ' ';
    output[0][1] = ' ';
    output[2 * height - 1][2 * width] = ' ';
    return output.map(function (r) { return r.join(''); });
}

// Choose random element from S and splice it out
function choose (S) {
    var i = Math.floor(Math.random() * S.length);
    var chosen = S.splice(i, 1);
    return chosen[0];
}

// Generate a random walk from unvisited nodes using a loop-erased random walk
function randomPath (M, E) {
    var start = choose(E);
    var steps = walk(start, E, M, []);
    var nodes = [];
    var adjacencies = [];
    steps.forEach(function (step) {
        adjacencies.push(step);
        nodes.push(step[0]);
        remove(E, step[0]);
    });
    return {
        nodes: nodes,
        adjacencies: adjacencies,
    };
}

function remove (S, a) {
    if (!contains(S, a))
        return;
    for (var i in S) {
        if (equal(S[i], a)) {
            S.splice(i, 1);
            return;
        }
    }
}

// Random walk until a terminal element is reached. Returns walk adjacencies
function walk (start, destinations, terminals, steps) {
    var allSpaces = destinations.concat(terminals)
    var neighbors = allSpaces.filter(function (d) { return isAdj(start, d); });
    var destination = choose(neighbors);

    // if we stepped onto the maze, stop the walk
    if (contains(terminals, destination)) {
        steps.push([start, destination]);
        return steps;
    } else {
        // cycles occur when the current destination was the start of a
        // previous step
        var priorIx = -1;
        var cycle = steps.some(function (step, i) {
            if (equal(destination, step[0])) {
                priorIx = i;
                return true;
            }
        });

        // if we just closed a cycle, prune all steps from the start of the
        // cycle up to now
        if (cycle) {
            steps = steps.slice(0, priorIx);
        } else {
            // otherwise just append this step
            steps.push([start, destination]);
        }
        return walk(destination, destinations, terminals, steps);
    }
}

function fst (S) {
    return S[0];
}

function snd (S) {
    return S[1];
}

function equal (a, b) {
    return a[0] == b[0] && a[1] == b[1];
}
    
function contains (S, a) {
    return S.some(function (s) {
        return equal(s, a);
    });
}

function isAdj (a, b) {
    var sameRow = a[0] === b[0];
    var sameCol = a[1] === b[1];
    return (sameRow ^ sameCol) && Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1;
}
