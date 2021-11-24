// MINIMUM DATE
function getMinDate(){
  let currentDate = new Date();
  let cDay = currentDate.getDate()
  let cMonth = currentDate.getMonth() + 1
  let cYear = currentDate.getFullYear()
  let min_date = cYear + '-' + cMonth + '-' + cDay
  if(cMonth < 10){
      min_date = cYear + '-0' + cMonth
      if(cDay < 10){
          min_date = min_date + '-0' + cDay
      } else{
          min_date = min_date + '-' + cDay
      }
  } else{
      min_date = cYear + '-' + cMonth
      if(cDay < 10){
          min_date = min_date + '-0' + cDay
      } else{
          min_date = min_date + '-' + cDay
      }
  }
  return min_date;
}


// PARSE DATE - 
// Notes: getMonth() start from 0
//        getDay() -> The value returned by getDay is an integer corresponding to the day of the week: 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on.
//        use getDate to return the day date
function parseDate(isoDate){
  var date = new Date(isoDate);
  var parsedDate = (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + "-" + date.getUTCFullYear();
  if (parsedDate.length == 8) {
      parsedDate = "0" + (date.getUTCMonth() + 1) + "-0" + date.getUTCDate() + "-" + date.getUTCFullYear();
  } else if (parsedDate.length == 9){
      const arr = parsedDate.split("-");
      if (arr[0].length == 1){
          parsedDate = "0" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + "-" + date.getUTCFullYear();
      } else {
          parsedDate = (date.getUTCMonth() + 1) + "-0" + date.getUTCDate() + "-" + date.getUTCFullYear();
      }
  }
  return parsedDate
}

// PARSE FIRST NAME
function getFirstName(full_name){
  const nameArr = full_name.split(" ");
  var first_name = nameArr[0];
  for (var i = 1; i < nameArr.length - 2; i++){
      first_name = first_name + " " + nameArr[i]
  }
  // console.log("first name: " + first_name);
  return first_name;
}

// PARSE LAST NAME
function getLastName(full_name){
  const nameArr = full_name.split(" ");
  const last_name = nameArr[nameArr.length - 1];
  // console.log("last name: " + last_name);
  return last_name;
}

// HIGH TRAFFIC DAY? Assumption: Weekends and Holidays and Observances are 'High Traffic Days'
const highTrafficDays = ["1-1", "2-14", "5-8", "5-31", "6-20", "7-4", "9-6", "9-11", "11-11", "11-25", "12-25"]
function isHighTraffic(date){
    const month_and_day = (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
    if(date.getUTCDay() == 6 || date.getUTCDay() == 0){
        return true
    } else {
        if (highTrafficDays.indexOf(month_and_day) >= 0){
            return true
        }
        return false
    }
}

// Holidays and Observances in United States in 2021
// Date	 	Name
// 01-01	New Year's Day
// 02-14    Valentine's
// 05-08    Mother's Day
// 05-31	Memorial Day
// 06-20    Father's Day 2021
// 07-04	Independence Day
// 09-06	Labor Day	
// 09-11    9/11 Memorial	  	 
// 11-11	Veterans Day
// 11-25	Thanksgiving Day	 	 
// 12-25	Christmas Day	

function getPreferredTable(arr){
  var maxTable = Math.max(...arr)
  return arr.indexOf(maxTable)
}

// returns the table nums to query for
function tableMinMax(numGuests){
    if (numGuests > 6) {
        var arr = [17, 20]
        return arr
    } else if (numGuests > 4) {
        var arr = [12, 16]
        return arr
    } else if (numGuests > 2) {
        var arr = [6, 11]
        return arr
    } else {
        var arr = [1, 5]
        return arr
    }
}

function identifyUsedCombinedTables(reservations){
    var r = reservations
    var usedTables = [], tempArr = []
    var s = ""

    for (var i = 0; i < r.length; i++){
        // remove whitespace
        s = (r[i].table_num).replace(/\s+/g, '');
        // split tables separated by '+' to array
        tempArr = s.split("+")
        // add tables to usedTables array
        for (var j = 0; j < tempArr.length; j++){
            usedTables.push("" + tempArr[j])
        }
    }
    return usedTables
}

function identifyUsedSingleTables(reservations){
    var r = reservations
    var usedTables = []

    for (var i = 0; i < r.length; i++){
        usedTables.push("" + r[i].table_num)
    }
    return usedTables
}


var allTables = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]
var str_tablesOfTwo = ["1", "2", "3", "4", "5"]
var str_tablesOfFour = ["6", "7", "8", "9", "10", "11"]
var str_tablesOfSix = ["12", "13", "14", "15", "16"]
var str_tablesOfEight = ["17", "18", "19", "20"]

// pass in array with all available tables, returns only tables of eight
function identifyTablesOfEight(tables){
    var arr = []
    for (var i = 0; i < str_tablesOfEight.length; i++){
        if (tables.includes(str_tablesOfEight[i])){
            arr.push("" + str_tablesOfEight[i])
        }
    }
    return arr
}
// pass in array with all available tables, returns only tables of six
function identifyTablesOfSix(tables){
    var arr = []
    for (var i = 0; i < str_tablesOfSix.length; i++){
        if (tables.includes(str_tablesOfSix[i])){
            arr.push("" + str_tablesOfSix[i])
        }
    }
    return arr
}

// pass in array with all available tables, returns only tables of four
function identifyTablesOfFour(tables){
    var arr = []
    for (var i = 0; i < str_tablesOfFour.length; i++){
        if (tables.includes(str_tablesOfFour[i])){
            arr.push("" + str_tablesOfFour[i])
        }
    }
    return arr
}

// pass in array with all available tables, returns only tables of two
function identifyTablesOfTwo(tables){
    var arr = []
    for (var i = 0; i < str_tablesOfTwo.length; i++){
        if (tables.includes(str_tablesOfTwo[i])){
            arr.push("" + str_tablesOfTwo[i])
        }
    }
    return arr
}



module.exports = {
    getMinDate, 
    parseDate, 
    getFirstName, 
    getLastName, 
    isHighTraffic, 
    getPreferredTable, 
    tableMinMax, 
    identifyUsedCombinedTables, 
    identifyUsedSingleTables,
    identifyTablesOfEight,
    identifyTablesOfSix,
    identifyTablesOfFour,
    identifyTablesOfTwo
};