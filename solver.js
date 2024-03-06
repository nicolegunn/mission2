const SIZE = 9;
const BOX_SIZE = Math.sqrt(SIZE);
const sudokuTable = document.getElementById("sudoku-table").firstElementChild; //tbody is child element of table element
const maximumIterations = 1000;

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

//Removes a given cellValue from a given cellID
function remove(cellID, cellValue) {
  if (cellID in possibleValues) {
    let index = possibleValues[cellID].indexOf(Number(cellValue));
    if (index !== -1) {
      possibleValues[cellID].splice(index, 1);
    }
  }
}

/*Removes impossible values from the cells in the same row, column and box as the subject
      i.e. removes the subject cell's value from the array of possible values for each related cell*/
function removeImpossibleValues(populatedCellID) {
  const cell = retrieveTableCellInfo(populatedCellID);
  /*For each cell in the same row, column or box class as the cell with the given populatedCellID, 
  the remove function is used to check for the populated cell's value in the possible values array of each cell and removes it if present*/
  for (let i = 0; i < SIZE; i++) {
    let cellInSameRow = rows[cell.rowClass][i];
    remove(cellInSameRow, cell.value);
    let cellInSameColumn = columns[cell.columnClass][i];
    remove(cellInSameColumn, cell.value);
    let cellInSameBox = boxes[cell.boxClass][i];
    remove(cellInSameBox, cell.value);
  }
}

function setCellValue(cellID, cellValue) {
  let cell = retrieveTableCellInfo(cellID);
  cell.tableCell.classList.add("solved");
  cell.tableCell.value = cellValue;
  enteredValues[cell.ID] = cellValue;
  delete possibleValues[cell.ID];
  removeImpossibleValues(cell.ID);
}

/*Adds cell number and value of populated cells to the enteredValues object. 
The key for each property is the cell number and the value is that of the cell input.*/
function populateEnteredValues() {
  for (let i = 1; i <= SIZE * SIZE; i++) {
    let tableCell = document.getElementById(`cell${i}`);
    tableCell.value === ""
      ? delete enteredValues[String(i)]
      : (enteredValues[i] = Number(tableCell.value));
  }
}

// Creates an object with keys equal to the cell number of all unpopulated cells and the value equal to an array of their possible values
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

function solve() {
  /*Checks whether any cells have only one possible value, if so, 
  that value is applied and removed from the arrays in the possibleValues object for cells with the same row, column or box classes*/
  function checkSingleSolution() {
    for (let cellID in possibleValues) {
      if (possibleValues[cellID].length === 1) {
        let cellValue = possibleValues[cellID][0];
        setCellValue(cellID, cellValue);
      }
    }
  }

  function checkArrays(obj, arrLabels) {
    for (let i = 1; i <= SIZE; i++) {
      let arr = obj[`${arrLabels}${i}`];

      let remainingValues = [...Array(SIZE).keys()].map((key) => key + 1);
      let valueCount = {};

      //Collects all the cell IDs in the subject array (row, column or box i)
      for (let cell of arr) {
        //Adjusts the remainingValues array by removing all entered values
        if (cell in enteredValues) {
          remainingValues.splice(
            remainingValues.indexOf(enteredValues[cell]),
            1
          );
        }
      }

      /*Creates an obj inside valueCount for each remainingValue with keys of count and ID. 
        Count is a number, IDs is an array of cell numbers for which the remaining value is a possible value*/
      for (let cell of remainingValues) {
        valueCount[cell] = { count: 0, IDs: [] };
      }

      /*Loops through each cellID in the subject array, checks if the cellID is in the possibleValues object,
            if it is, then sets the possibleValuesArray = the array stored at possibleValues[cellID],
            then for each value in that array it adds 1 to the count of that value within the valueCount object 
            and pushes the cellID to the IDs array within valueCount*/
      for (let cell of arr) {
        if (cell in possibleValues) {
          let possibleValuesArray = possibleValues[cell];

          for (let cellValue of possibleValuesArray) {
            valueCount[cellValue]["count"] += 1;
            valueCount[cellValue]["IDs"].push(cell);
          }
        }
      }

      for (let val in valueCount) {
        //Checks the valueCount object for instances of a single cell solution for a remaining value and applies the value to this cell.
        if (valueCount[val].count === 1) {
          setCellValue(valueCount[val].IDs[0], Number(val));
        } else if (obj !== boxes) {
          /*If all occurrences of a remaining value within a row/column occur within the same box, 
          then that value is removed from other box cells within the Possible Values object. */
          let firstCell = retrieveTableCellInfo(valueCount[val]["IDs"][0]);
          let boxClass = firstCell.boxClass;

          let valueCountCellsInSameBox = valueCount[val]["IDs"].filter(
            (cellID) => boxes[boxClass].includes(cellID)
          );

          if (
            valueCount[val]["IDs"].length === valueCountCellsInSameBox.length
          ) {
            let cellsToAdjust = Object.keys(possibleValues)
              .filter((key) => boxes[boxClass].includes(Number(key)))
              .filter((id) => !valueCountCellsInSameBox.includes(Number(id)));

            if (cellsToAdjust.length > 0) {
              for (let cell of cellsToAdjust) {
                remove(cell, val);
              }
            }
          }
        }
      }

      let idsInPossibleValuesAndObjArray = Object.keys(possibleValues).filter(
        (key) => arr.includes(Number(key))
      );
      let length2Keys = idsInPossibleValuesAndObjArray.filter(
        (key) => possibleValues[key].length === 2
      );

      if (length2Keys.length > 0) {
        for (let x = 0; x < length2Keys.length - 1; x++) {
          for (let y = x + 1; y < length2Keys.length; y++) {
            if (
              possibleValues[length2Keys[x]].join() ===
              possibleValues[length2Keys[y]].join()
            ) {
              let cell1 = length2Keys[x];
              let cell2 = length2Keys[y];
              let value1 = possibleValues[cell1][0];
              let value2 = possibleValues[cell1][1];
              for (let id of idsInPossibleValuesAndObjArray) {
                if (id !== cell1 && id !== cell2) {
                  remove(id, value1);
                  remove(id, value2);
                }
              }
            }
          }
        }
      }
    }
  }

  let length = Object.keys(possibleValues).length;
  let count = 0;

  do {
    checkSingleSolution();
    checkArrays(rows, "row");
    checkArrays(columns, "column");
    checkArrays(boxes, "box");
    length = Object.keys(possibleValues).length;
    count++;

    if (count > maximumIterations) {
      for (key in possibleValues) {
        let cell = retrieveTableCellInfo(key);
        cell.tableCell.value = possibleValues[key];
        cell.tableCell.classList.add("unsolvable");
      }
      alert(`Puzzle can not be solved within ${maximumIterations} iterations`);
      break;
    }
  } while (length > 0);
}

function solvePuzzle(event) {
  event.preventDefault();
  populateEnteredValues();

  if (checkInvalid()) {
    alert("Puzzle Invalid");
  } else {
    populatePossibleValues();
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
    cell.tableCell.classList.remove("unsolvable");
  }
}

function checkInvalid() {
  function checkRepeatNums(obj, arrLabels) {
    let Invalid = false;
    for (let i = 1; i <= SIZE; i++) {
      let arr = obj[`${arrLabels}${i}`];

      let cellsInSameArr = Object.keys(enteredValues).filter((key) =>
        arr.includes(Number(key))
      );
      let valsInSameArr = cellsInSameArr
        .map((key) => enteredValues[key])
        .filter((val) => val);
      console.log(valsInSameArr);

      if (valsInSameArr.length !== new Set(valsInSameArr).size) {
        Invalid = true;
      }
    }
    return Invalid;
  }

  let checkRows = checkRepeatNums(rows, "row");
  let checkCols = checkRepeatNums(columns, "column");
  let checkBoxes = checkRepeatNums(boxes, "box");

  return checkRows || checkCols || checkBoxes;
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

function populateUnsolvable(event) {
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
