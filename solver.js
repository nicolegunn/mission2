const SIZE = 9;
const BOX_SIZE = Math.sqrt(SIZE);
const sudokuTable = document.getElementById("sudoku-table").firstElementChild; //tbody is child element of table element
const maximumIterations = 10000;

const rows = {};
const columns = {};
const boxes = {};

const enteredValues = {};
const possibleValues = {};

for (let i = 1; i <= SIZE; i++) {
  //Set up an array for each row, column and box within their respective objects
  rows[`row${i}`] = [];
  columns[`column${i}`] = [];
  boxes[`box${i}`] = [];
}

/*Add cell ID, row, column and box classes to each table cell
and populate the row, column and box arrays with their corresponding cell numbers*/
let cell = 0;
for (let i = 0; i < SIZE; i++) {
  for (let j = 0; j < SIZE; j++) {
    cell += 1;
    let row = i + 1;
    let column = j + 1;
    let box =
      Math.floor(j / BOX_SIZE) + Math.floor(i / BOX_SIZE) * BOX_SIZE + 1;

    let tableCell = sudokuTable.children[i].children[j].firstElementChild; //accesses the input element within each table cell

    let cellID = `cell${cell}`;
    let rowClass = `row${row}`;
    let columnClass = `column${column}`;
    let boxClass = `box${box}`;

    tableCell.setAttribute("id", cellID);
    tableCell.classList.add(rowClass);
    tableCell.classList.add(columnClass);
    tableCell.classList.add(boxClass);

    /*The row, column and box arrays (stored within their respective objects) 
    have the same names as the classes applied to the corresponding elements(cells)*/
    rows[rowClass].push(cell);
    columns[columnClass].push(cell);
    boxes[boxClass].push(cell);
  }
}

//..................................................................................................................//

// Creates an object of info relating to a given cell
function retrieveTableCellInfo(cellID) {
  const cell = { ID: cellID };
  cell.tableCell = document.getElementById(`cell${cellID}`);
  cell.value = Number(cell.tableCell.value);
  const classList = cell.tableCell.classList;
  cell.rowClass = classList[0];
  cell.columnClass = classList[1];
  cell.boxClass = classList[2];

  return cell;
}

/*1. Adds cell number and value of populated cells to the enteredValues object. 
The key for each property is the cell number and the value is that of the cell input.*/
function populateEnteredValues() {
  for (let i = 1; i <= SIZE * SIZE; i++) {
    let tableCell = document.getElementById(`cell${i}`);
    tableCell.value === ""
      ? delete enteredValues[String(i)]
      : (enteredValues[i] = Number(tableCell.value));
  }
}

/*3. Removes impossible values from the cells in the same row, column and box as the subject
      i.e. removes the subject cell's value from the array of possible values for each related cell*/
function removeImpossibleValues(populatedCellID) {
  const cell = retrieveTableCellInfo(populatedCellID);

  function remove(cellID) {
    cellID = String(cellID);
    if (cellID in possibleValues) {
      let index = possibleValues[cellID].indexOf(cell.value);
      if (index !== -1) {
        possibleValues[cellID].splice(index, 1);
      }
    }
  }

  /*For each cell in the same row, column or box class as the cell with the given populatedCellID, 
  the remove function is used to check for the populated cell's value in the possible values array of each cell and removes it if present*/
  for (let i = 0; i < SIZE; i++) {
    let cellInSameRow = rows[cell.rowClass][i];
    remove(cellInSameRow);
    let cellInSameColumn = columns[cell.columnClass][i];
    remove(cellInSameColumn);
    let cellInSameBox = boxes[cell.boxClass][i];
    remove(cellInSameBox);
  }
}

//2. Creates an object with keys equal to the cell number of all unpopulated cells and the value equal to an array of their possible values
//    Calls the removeImpossibleValues() 3. above.
function populatePossibleValues() {
  for (let i = 1; i <= SIZE * SIZE; i++) {
    String(i) in enteredValues
      ? delete possibleValues[String(i)]
      : (possibleValues[i] = [...Array(SIZE).keys()].map((key) => key + 1));
  }

  for (let cell in enteredValues) {
    removeImpossibleValues(cell);
  }
}

//4.
function solve() {
  function checkSingleSolution() {
    for (let cellID in possibleValues) {
      if (possibleValues[cellID].length === 1) {
        let cell = retrieveTableCellInfo(cellID);
        cell.tableCell.classList.add("solved");
        cell.tableCell.value = possibleValues[cellID][0];

        enteredValues[cellID] = possibleValues[cellID][0];
        delete possibleValues[cellID];
        removeImpossibleValues(cellID);
      }
    }
  }

  function checkArrays(obj, arrLabels) {
    for (let i = 1; i <= SIZE; i++) {
      let arr = obj[`${arrLabels}${i}`];

      let remainingValues = [...Array(SIZE).keys()].map((key) => key + 1);
      let valueCount = {};

      for (let j = 0; j < arr.length; j++) {
        let cellID = arr[j];

        //Adjusts the remainingValues array initialized above by removing all entered values
        if (cellID in enteredValues) {
          remainingValues.splice(
            remainingValues.indexOf(enteredValues[cellID]),
            1
          );
        }
      }

      /*Creates an obj inside valueCount for each remainingValue with keys of count and ID. 
        Count is a number, IDs is an array of cell numbers for which the remaining value is a possible value*/
      for (let j = 0; j < remainingValues.length; j++) {
        valueCount[remainingValues[j]] = { count: 0, IDs: [] };
      }

      /*Loops through each cellID in the appropriate row, column or box array, checks if the cellID is in the possibleValues object,
            if it is, then sets the possibleValuesArray = the array stored at possibleValues[cellID],
            then for each value in that array, it checks whether the value exists as a key in the valueCount object, 
            and if so, it adds 1 to the count and pushes the cellID to the IDs array within valueCount*/
      for (let j = 0; j < arr.length; j++) {
        let cellID = arr[j];

        if (cellID in possibleValues) {
          let possibleValuesArray = possibleValues[cellID];

          for (let x = 0; x < possibleValuesArray.length; x++) {
            let value = possibleValuesArray[x];
            //there is an error happening when this if statement isn't included - need to work out why
            //if the cellID is in possibleValues then surely the values would all be in valueCount:
            if (value in valueCount) {
              let count = valueCount[value]["count"];
              count++;
              valueCount[value]["count"] = count;

              valueCount[value]["IDs"].push(cellID);
            }
          }
        }
      }

      for (let val in valueCount) {
        if (valueCount[val].count === 1) {
          let cellID = valueCount[val].IDs[0];

          let cell = retrieveTableCellInfo(cellID);

          cell.tableCell.classList.add("solved");
          cell.tableCell.value = Number(val);

          enteredValues[cellID] = Number(val);
          delete possibleValues[cellID];
          removeImpossibleValues(cellID);
        }
      }
    }
  }

  //<----Testing new code below this line------>

  function checkDoubles() {
    for (box = 1; box <= SIZE; box++) {
      let idsInPossibleValuesAndBox = Object.keys(possibleValues).filter(
        (key) => boxes[`box${box}`].includes(Number(key))
      );

      let length2Keys = idsInPossibleValuesAndBox.filter(
        (key) => possibleValues[key].length === 2
      );

      if (length2Keys.length > 0) {
        for (i = 0; i < length2Keys.length - 1; i++) {
          for (j = i + 1; j < length2Keys.length; j++) {
            if (
              possibleValues[length2Keys[i]].join() ===
              possibleValues[length2Keys[j]].join()
            ) {
              let cell1 = retrieveTableCellInfo(length2Keys[i]);
              let cell2 = retrieveTableCellInfo(length2Keys[j]);

              for (let id of idsInPossibleValuesAndBox) {
                if (id !== cell1.ID && id !== cell2.ID) {
                  let index = possibleValues[id].indexOf(
                    possibleValues[cell1.ID][0]
                  );

                  if (index !== -1) {
                    possibleValues[id].splice(index, 1);
                  }

                  index = possibleValues[id].indexOf(
                    possibleValues[cell1.ID][1]
                  );

                  if (index !== -1) {
                    possibleValues[id].splice(index, 1);
                  }
                }
              }

              if (cell1.rowClass === cell2.rowClass) {
                let idsInPossibleValuesAndRow = Object.keys(
                  possibleValues
                ).filter((key) => rows[cell1.rowClass].includes(Number(key)));

                for (let id of idsInPossibleValuesAndRow) {
                  if (id !== cell1.ID && id !== cell2.ID) {
                    let index = possibleValues[id].indexOf(
                      possibleValues[cell1.ID][0]
                    );

                    if (index !== -1) {
                      possibleValues[id].splice(index, 1);
                    }

                    index = possibleValues[id].indexOf(
                      possibleValues[cell1.ID][1]
                    );

                    if (index !== -1) {
                      possibleValues[id].splice(index, 1);
                    }
                  }
                }
              }

              if (cell1.columnClass === cell2.columnClass) {
                let idsInPossibleValuesAndCol = Object.keys(
                  possibleValues
                ).filter((key) =>
                  columns[cell1.columnClass].includes(Number(key))
                );

                for (let id of idsInPossibleValuesAndCol) {
                  if (id !== cell1.ID && id !== cell2.ID) {
                    let index = possibleValues[id].indexOf(
                      possibleValues[cell1.ID][0]
                    );
                    if (index !== -1) {
                      possibleValues[id].splice(index, 1);
                    }
                    index = possibleValues[id].indexOf(
                      possibleValues[cell1.ID][1]
                    );
                    if (index !== -1) {
                      possibleValues[id].splice(index, 1);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  //<----Testing new code above this line------>

  let length = Object.keys(possibleValues).length;
  let count = 0;

  do {
    checkSingleSolution();
    checkArrays(rows, "row");
    checkArrays(columns, "column");
    checkArrays(boxes, "box");
    length = Object.keys(possibleValues).length;
    count++;
    if (count % 2 === 0) {
      checkDoubles();
    }
    if (count > maximumIterations) {
      console.log(possibleValues);
      for (key in possibleValues) {
        let cell = retrieveTableCellInfo(key);
        cell.tableCell.value = possibleValues[key];
        cell.tableCell.style.fontSize = "10px";
      }
      alert(`Puzzle can not be solved within ${maximumIterations} iterations`);
      break;
    }
  } while (length > 0);
}

function solvePuzzle(event) {
  event.preventDefault();
  populateEnteredValues();
  populatePossibleValues();
  if (checkInvalid()) {
    alert("Puzzle Invalid");
  } else {
    solve();
  }
}

function reset() {
  for (let i = 1; i <= SIZE * SIZE; i++) {
    let cell = retrieveTableCellInfo(i);
    delete enteredValues[String(i)];
    delete possibleValues[String(i)];
    cell.tableCell.value = "";
    cell.tableCell.classList.remove("solved");
  }
}

function checkInvalid() {
  for (let i = 1; i <= SIZE; i++) {
    let rowArr = rows[`row${i}`];
    let colArr = columns[`column${i}`];
    let boxArr = boxes[`box${i}`];

    function checkArr(arr) {
      let arrVals = [];
      for (let j = 0; j < SIZE; j++) {
        let cell = retrieveTableCellInfo(arr[j]);
        if (cell.value) {
          arrVals.push(cell.value);
        }
      }

      return arrVals.length === new Set(arrVals).size;
    }

    return !checkArr(rowArr) || !checkArr(colArr) || !checkArr(boxArr);
  }
}

function populateDemoGame(event) {
  event.preventDefault();
  reset();
  document.getElementById(`cell1`).value = 5;
  document.getElementById(`cell3`).value = 7;
  document.getElementById(`cell5`).value = 9;
  document.getElementById(`cell8`).value = 1;
  document.getElementById(`cell9`).value = 4;
  document.getElementById(`cell11`).value = 2;
  document.getElementById(`cell16`).value = 5;
  document.getElementById(`cell21`).value = 1;
  document.getElementById(`cell24`).value = 4;
  document.getElementById(`cell25`).value = 2;
  document.getElementById(`cell26`).value = 9;
  document.getElementById(`cell35`).value = 4;
  document.getElementById(`cell37`).value = 2;
  document.getElementById(`cell40`).value = 5;
  document.getElementById(`cell42`).value = 9;
  document.getElementById(`cell45`).value = 6;
  document.getElementById(`cell47`).value = 9;
  document.getElementById(`cell56`).value = 3;
  document.getElementById(`cell57`).value = 6;
  document.getElementById(`cell58`).value = 7;
  document.getElementById(`cell61`).value = 4;
  document.getElementById(`cell66`).value = 5;
  document.getElementById(`cell71`).value = 3;
  document.getElementById(`cell73`).value = 9;
  document.getElementById(`cell74`).value = 4;
  document.getElementById(`cell77`).value = 6;
  document.getElementById(`cell79`).value = 7;
  document.getElementById(`cell81`).value = 8;
}

function populateHardDemoGame(event) {
  event.preventDefault();
  reset();
  document.getElementById(`cell2`).value = 9;
  document.getElementById(`cell5`).value = 3;
  document.getElementById(`cell7`).value = 2;
  document.getElementById(`cell9`).value = 4;
  document.getElementById(`cell10`).value = 6;
  document.getElementById(`cell16`).value = 8;
  document.getElementById(`cell18`).value = 3;
  document.getElementById(`cell21`).value = 7;
  document.getElementById(`cell24`).value = 5;
  document.getElementById(`cell26`).value = 1;
  document.getElementById(`cell27`).value = 9;
  document.getElementById(`cell29`).value = 2;
  document.getElementById(`cell30`).value = 6;
  document.getElementById(`cell33`).value = 8;
  document.getElementById(`cell39`).value = 5;
  document.getElementById(`cell41`).value = 1;
  document.getElementById(`cell43`).value = 9;
  document.getElementById(`cell49`).value = 3;
  document.getElementById(`cell52`).value = 5;
  document.getElementById(`cell53`).value = 6;
  document.getElementById(`cell55`).value = 4;
  document.getElementById(`cell56`).value = 8;
  document.getElementById(`cell58`).value = 5;
  document.getElementById(`cell61`).value = 1;
  document.getElementById(`cell64`).value = 1;
  document.getElementById(`cell66`).value = 9;
  document.getElementById(`cell72`).value = 5;
  document.getElementById(`cell73`).value = 5;
  document.getElementById(`cell75`).value = 2;
  document.getElementById(`cell77`).value = 9;
  document.getElementById(`cell80`).value = 4;
}
