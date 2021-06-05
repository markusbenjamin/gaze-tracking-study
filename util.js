function transpose(matrix) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

function mean(matrix) {
    var accum = [];
    for (var j = 0; j < matrix[0].length; j++) {
        accum.push(0);
    }
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] != NaN) {
                accum[j] += matrix[i][j];
            }
        }
    }
    for (var j = 0; j < matrix[0].length; j++) {
        accum[j] = accum[j] / matrix.length;
    }
    return accum;
}