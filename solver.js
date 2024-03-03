const SIZE = 9;
const BOX_SIZE = Math.sqrt(SIZE);
const sudokuTable = document.getElementById("sudoku-table").firstElementChild; //tbody is child element of table element

const rows = {};
const columns = {};
const boxes = {};

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

    let tableCell = sudokuTable.children[i].children[j].firstElementChild;

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

//1. Creates an object of populated cell values. The key for each property is the cell number and the value is that of the cell input.
function getPopulatedCellValues() {
  const populatedCellValues = {};
  for (let i = 1; i <= SIZE * SIZE; i++) {
    let tableCell = document.getElementById(`cell${i}`);
    if (tableCell.value !== "") {
      populatedCellValues[i] = Number(tableCell.value);
    }
  }
  return populatedCellValues;
}

//3. Called by the createPossibleValuesObj function
function removeImpossibleValues(populatedCellID, possValuesObject) {
  const cell = retrieveTableCellInfo(populatedCellID);

  function remove(key) {
    if (key in possValuesObject) {
      let index = possValuesObject[key].indexOf(cell.value);
      if (index !== -1) {
        possValuesObject[key].splice(index, 1);
      }
    }
  }

  /*For each cell in the same row, column or box class as the cell with the given populatedCellID, 
  the remove function is used to check for the populated cell's value in the possible values array of each cell and removes it if present*/

  for (i = 0; i < SIZE; i++) {
    let rowKey = rows[cell.rowClass][i];
    remove(rowKey);
    let columnKey = columns[cell.columnClass][i];
    remove(columnKey);
    let boxKey = boxes[cell.boxClass][i];
    remove(boxKey);
  }
}

//2. Creates an object with keys equal to the cell number of all unpopulated cells and the value equal to an array of their possible values
//    Calls the removeImpossibleValues() 3. above.
function createPossibleValuesObj(populatedValues) {
  const possibleValues = {};
  for (let i = 1; i <= SIZE * SIZE; i++) {
    if (!(String(i) in populatedValues)) {
      possibleValues[i] = [...Array(SIZE).keys()].map((key) => key + 1); //creates an array of 1-9 for each unpopulated cell
    }
  }

  for (let cell in populatedValues) {
    removeImpossibleValues(cell, possibleValues);
  }
  return possibleValues;
}

//4.
function solve(possibleValues, existingValues) {
  function checkSingleSolution() {
    for (let key in possibleValues) {
      if (possibleValues[key].length === 1) {
        let cell = retrieveTableCellInfo(key);
        cell.tableCell.classList.add("solved");
        cell.tableCell.value = possibleValues[key][0];

        existingValues[key] = possibleValues[key][0];
        delete possibleValues[key];
        removeImpossibleValues(key, possibleValues);
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

        //Adjusts the remainingValues array initialized above by removing all existing values
        if (cellID in existingValues) {
          remainingValues.splice(
            remainingValues.indexOf(existingValues[cellID]),
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
          let possibleValuesArray = possibleValues[cellID]; //?? Not sure whether any issues here should I be copying the possibleValues[cellID] array

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
          cell.tableCell.value = val;

          existingValues[cellID] = val;
          delete possibleValues[cellID];
          removeImpossibleValues(cellID, possibleValues);
        }
      }
    }
  }

  let length = Object.keys(possibleValues).length;
  do {
    checkSingleSolution();
    checkArrays(rows, "row");
    checkArrays(columns, "column");
    checkArrays(boxes, "box");
    length = Object.keys(possibleValues).length;
    console.log(length);
  } while (length > 0);
}

function solvePuzzle() {
  const existingCellValues = getPopulatedCellValues();
  const possibleCellValues = createPossibleValuesObj(existingCellValues);
  solve(possibleCellValues, existingCellValues);
}

function populateDemoGame() {
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
