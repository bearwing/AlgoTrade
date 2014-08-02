/* ------------------------------------------ */
/*         Section A - Data Settings          */
/* ------------------------------------------ */

// User Input
var default_date_shift = 400;

// Do not change here
var date_from = new Date();
date_from.setDate(date_from.getDate() - default_date_shift);
document.getElementById('time_from').valueAsDate = date_from;
document.getElementById('time_to').valueAsDate = new Date();
var data_diff = 0;

/* ------------------------------------------ */
/*          Section B - Code Mirror           */
/* ------------------------------------------ */

var UDF2 = CodeMirror.fromTextArea(document.getElementById("UDF2"), {
    lineNumbers: true,
    matchBrackets: true,
  });
UDF2.setSize("100%", 300);

/*
var long_strategies = CodeMirror.fromTextArea(document.getElementById("long_strategies"), {
    lineNumbers: true,
    matchBrackets: true,
  });
long_strategies.setSize("100%", 30);
var short_strategies = CodeMirror.fromTextArea(document.getElementById("short_strategies"), {
    lineNumbers: true,
    matchBrackets: true,
  });
short_strategies.setSize("100%", 30);
*/

/* ------------------------------------------ */
/*          Section C - Algo Trade            */
/* ------------------------------------------ */

// Global Variables

var df;															// global time from, fixed after lockin
var dt;															// global time to, fixed after lockin
var stockcount = 0;												// global stock count, count # stocks imported

var dataTitle = [
					{ "title": "Time" },
					{ "title": "Action" },
					{ "title": "Cash" },
					{ "title": "Holding" },
					{ "title": "Cost" },
					{ "title": "Total" }
				];												// data title used in plotting result data, will pass to child window

/* ------------------------------------------ */
/*         Section D1 - RedSox Chart          */
/* ------------------------------------------ */

// RedSox Chart

//var redsoxplot = true;
var redsoxdates = [[new Date(), 1],[date_from, 1]];							// global red sox dates fit in for Red Sox Chart

google.load("visualization", "1.1", {packages:["calendar"]});
google.setOnLoadCallback(drawRedSoxChart);

//function plotredsox(){
//   drawRedSoxChart();
//   redsoxplot = false;
//}

function drawRedSoxChart() {
   var dataTable = new google.visualization.DataTable();
   dataTable.addColumn({ type: 'date', id: 'Date' });
   dataTable.addColumn({ type: 'number', id: 'Won/Loss' });
   dataTable.addRows(redsoxdates);

   var chart = new google.visualization.Calendar(document.getElementById('calendar_basic'));

   var options = {
	  width: "100%",
	  height: "100%",
   };

   chart.draw(dataTable, options);
}

/* ------------------------------------------ */
/*         Section D2 - Candle Chart          */
/* ------------------------------------------ */

var chart;
var graph;
var graphType = "candlestick";
var maxCandlesticks = 100;

var candleplot = true;
var chartStore = [];
var chartData = [];

//plotcandle
function plotcandle() {
   if (use_functions_bool.stockinfo() == "") {
      alert("Please input stock first");
	  return;
   }  else {
      chartData = chartStore[document.getElementById("candleselect").value];
	  plotamcandle();
	  candleplot = false;
	  return;
   }
}

//AmCharts.ready(
function plotamcandle() {
	// first parse data string      
    // parseData();

	// SERIAL CHART
	chart = new AmCharts.AmSerialChart();
	chart.pathToImages = "js/plugins/amcharts/images/";
	chart.dataProvider = chartData;
	chart.categoryField = "Date";
	// listen for dataUpdated event ad call "zoom" method then it happens
	chart.addListener('dataUpdated', zoomChart);
	// listen for zoomed event andcall "handleZoom" method then it happens
	chart.addListener('zoomed', handleZoom);

	// AXES
	// category
	var categoryAxis = chart.categoryAxis;
	categoryAxis.parseDates = true; // as our data is date-based, we set this to true
	categoryAxis.minPeriod = "DD"; // our data is daily, so we set minPeriod to "DD"
	categoryAxis.dashLength = 1;
	categoryAxis.tickLenght = 0;
	categoryAxis.inside = true;

	// value
	var valueAxis = new AmCharts.ValueAxis();
	valueAxis.dashLength = 1;
	valueAxis.axisAlpha = 0;
	chart.addValueAxis(valueAxis);

	// GRAPH
	graph = new AmCharts.AmGraph();
	graph.title = "Price:";
	// as candlestick graph looks bad when there are a lot of candlesticks, we set initial type to "line"
	graph.type = "line";
	// graph colors
	graph.lineColor = "#7f8da9";
	graph.fillColors = "#7f8da9";
	graph.negativeLineColor = "#db4c3c";
	graph.negativeFillColors = "#db4c3c";
	graph.fillAlphas = 1;
	// candlestick graph has 4 fields - open, low, high, close
	graph.openField = "Open";
	graph.highField = "High";
	graph.lowField = "Low";
	graph.closeField = "Close";
	graph.balloonText = "Open:<b>[[Open]]</b><br>Low:<b>[[Low]]</b><br>High:<b>[[High]]</b><br>Close:<b>[[Close]]</b><br>";
	// this one is for "line" graph type
	graph.valueField = "Close";

	chart.addGraph(graph);

	// CURSOR                
	var chartCursor = new AmCharts.ChartCursor();
	chart.addChartCursor(chartCursor);

	// SCROLLBAR
	var chartScrollbar = new AmCharts.ChartScrollbar();
	chartScrollbar.scrollbarHeight = 30;
	chartScrollbar.graph = graph; // as we want graph to be displayed in the scrollbar, we set graph here
	chartScrollbar.graphType = "line"; // we don't want candlesticks to be displayed in the scrollbar                
	chartScrollbar.gridCount = 4;
	chartScrollbar.color = "#FFFFFF";
	chart.addChartScrollbar(chartScrollbar);

	// WRITE
	chart.write("chartdiv");
};

// this method is called when chart is first inited as we listen for "dataUpdated" event
function zoomChart() {
	// different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
	chart.zoomToIndexes(chartData.length - 7, chartData.length - 1);
}

// this methid is called each time the selected period of the chart is changed
function handleZoom(event) {
	var startDate = event.startDate;
	var endDate = event.endDate;
	document.getElementById("startDate").value = AmCharts.formatDate(startDate, "DD/MM/YYYY");
	document.getElementById("endDate").value = AmCharts.formatDate(endDate, "DD/MM/YYYY");

	// as we also want to change graph type depending on the selected period, we call this method
	changeGraphType(event);
}

// changes graph type to line/candlestick, depending on the selected range
function changeGraphType(event) {
	var startIndex = event.startIndex;
	var endIndex = event.endIndex;

	if (endIndex - startIndex > maxCandlesticks) {
		// change graph type
		if (graph.type != "line") {
			graph.type = "line";
			graph.fillAlphas = 0;
			chart.validateNow();
		}
	} else {
		// change graph type
		if (graph.type != graphType) {
			graph.type = graphType;
			graph.fillAlphas = 1;
			chart.validateNow();
		}
	}
}

// this method converts string from input fields to date object 
function stringToDate(str) {
	var dArr = str.split("/");
	var date = new Date(Number(dArr[2]), Number(dArr[1]) - 1, dArr[0]);
	return date;
}

// this method is called when user changes dates in the input field
function changeZoomDates() {
	var startDateString = document.getElementById("startDate").value;
	var endDateString = document.getElementById("endDate").value;
	var startDate = stringToDate(startDateString);
	var endDate = stringToDate(endDateString);
	chart.zoomToDates(startDate, endDate);
}

/* ------------------------------------------ */
/*          Section D3 - UDF Chart            */
/* ------------------------------------------ */
var chart2;
var chart2Data = [];
var chart2Cursor;
var UDFplot = true;

//plotline
function plotlinealert() {
   if (use_functions_eval.stockinfo() == "") {
      alert("Please input stock first");
	  return;
   } else if (use_functions_eval.funcinfo() == "") {
      alert("Please input UDF first");
	  return;
   }  else {
	  UDFplot = false;
	  return;
   }
}

function plotline() {
   if (UDFplot == true) {
      return;
   } else {
      chart2Data = [];
      generateChartData(document.getElementById("UDFchartinput").value);
	  plotamline();
   }
	// JSONToCSVConvertor(chart2Data,true);
	// function JSONToCSVConvertor(JSONData, ShowLabel) {     

	// 	//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
	// 	var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
	// 	var CSV = '';    
	// 	//This condition will generate the Label/Header
	// 	if (ShowLabel) {
	// 	    var row = "";

	// 	    //This loop will extract the label from 1st index of on array
	// 	    for (var index in arrData[0]) {
	// 	        //Now convert each value to string and comma-seprated
	// 	        row += index + ',';
	// 	    }
	// 	    row = row.slice(0, -1);
	// 	    //append Label row with line break
	// 	    CSV += row + '\r\n';
	// 	}

	// 	//1st loop is to extract each row
	// 	for (var i = 0; i < arrData.length; i++) {
	// 	    var row = "";
	// 	    //2nd loop will extract each column and convert it in string comma-seprated
	// 	    for (var index in arrData[i]) {
	// 	        row += '"' + arrData[i][index] + '",';
	// 	    }
	// 	    row.slice(0, row.length - 1);
	// 	    //add a line break after each row
	// 	    CSV += row + '\r\n';
	// 	}

	// 	if (CSV == '') {        
	// 	    alert("Invalid data");
	// 	    return;
	// 	}   

	// 	//this trick will generate a temp "a" tag
	// 	var link = document.createElement("a");    
	// 	link.id="lnkDwnldLnk";

	// 	//this part will append the anchor tag and remove it after automatic click
	// 	document.body.appendChild(link);

	// 	var csv = CSV;  
	// 	blob = new Blob([csv], { type: 'text/csv' }); 
	// 	var csvUrl = window.webkitURL.createObjectURL(blob);
	// 	var filename = 'UserExport.csv';
	// 	$("#lnkDwnldLnk")
	// 	.attr({
	// 	    'download': filename,
	// 	    'href': csvUrl
	// 	}); 

	// 	$('#lnkDwnldLnk')[0].click();    
	// 	document.body.removeChild(link);
	// }
}

function plotamline() {
	// SERIAL chart2
	chart2 = new AmCharts.AmSerialChart();
	chart2.pathToImages = "js/plugins/amcharts/images/";
	chart2.dataProvider = chart2Data;
	chart2.categoryField = "date";
	chart2.balloon.bulletSize = 5;

	// listen for "dataUpdated" event (fired when chart2 is rendered) and call zoomChart method when it happens
	chart2.addListener("dataUpdated", zoomChart2);

	// AXES
	// category
	var categoryAxis2 = chart2.categoryAxis;
	categoryAxis2.parseDates = true; // as our data is date-based, we set parseDates to true
	categoryAxis2.minPeriod = "DD"; // our data is daily, so we set minPeriod to DD
	categoryAxis2.dashLength = 1;
	categoryAxis2.minorGridEnabled = true;
	categoryAxis2.twoLineMode = true;
	categoryAxis2.dateFormats = [{
		period: 'fff',
		format: 'JJ:NN:SS'
	}, {
		period: 'ss',
		format: 'JJ:NN:SS'
	}, {
		period: 'mm',
		format: 'JJ:NN'
	}, {
		period: 'hh',
		format: 'JJ:NN'
	}, {
		period: 'DD',
		format: 'DD'
	}, {
		period: 'WW',
		format: 'DD'
	}, {
		period: 'MM',
		format: 'MMM'
	}, {
		period: 'YYYY',
		format: 'YYYY'
	}];

	categoryAxis2.axisColor = "#DADADA";

	// value
	var valueAxis2 = new AmCharts.ValueAxis();
	valueAxis2.axisAlpha = 0;
	valueAxis2.dashLength = 1;
	chart2.addValueAxis(valueAxis2);

	// GRAPH
	var graph2 = new AmCharts.AmGraph();
	graph2.title = "red line";
	graph2.valueField = "visits";
	graph2.bullet = "round";
	graph2.bulletBorderColor = "#FFFFFF";
	graph2.bulletBorderThickness = 2;
	graph2.bulletBorderAlpha = 1;
	graph2.lineThickness = 2;
	graph2.lineColor = "#5fb503";
	graph2.negativeLineColor = "#efcc26";
	graph2.hideBulletsCount = 50; // this makes the chart2 to hide bullets when there are more than 50 series in selection
	chart2.addGraph(graph2);

	// CURSOR
	chart2Cursor = new AmCharts.ChartCursor();
	chart2Cursor.cursorPosition = "mouse";
	chart2Cursor.pan = true; // set it to fals if you want the cursor to work in "select" mode
	chart2.addChartCursor(chart2Cursor);
	
	// SCROLLBAR
	var chartScrollbar2 = new AmCharts.ChartScrollbar();
	chartScrollbar2.scrollbarHeight = 30;
	chartScrollbar2.graph = graph2; // as we want graph to be displayed in the scrollbar, we set graph here
	chartScrollbar2.graphType = "line"; // we don't want candlesticks to be displayed in the scrollbar                
	chartScrollbar2.gridCount = 4;
	chartScrollbar2.color = "#FFFFFF";
	chart2.addChartScrollbar(chartScrollbar2);
	chart2.creditsPosition = "bottom-right";
	
	// WRITE
	chart2.write("chartdiv2");
};

// generate some random data, quite different range
function generateChartData(inputstr) {

	var UDFdates = [];															// UDF Dates
	var UDFvalue = 0;															// UDF value
	
	UDFdates = use_functions_eval.stockoutput("DATE",1);

    var ttfrom = 1;															    // Time from
    var ttto = UDFdates.length - 1;	  										    // Time to

    use_functions_eval.pass_value("max_t", ttto);								// Pass Maximum time into Parser	

	var firstDate = new Date(UDFdates[0]);

    for (var curr_t = ttfrom; curr_t <= ttto; curr_t++) {	
	    // Since data in array start from 0, need to be adjusted
	    var adj_curr_t = curr_t - 1;
        use_functions_eval.pass_value("curr_t", adj_curr_t);
	   
	    var newDate = new Date(UDFdates[adj_curr_t]);

        try{UDFvalue = use_functions_eval.parse(inputstr);}catch(e){alert(e.message);break;};
		
		/*
		if (isNaN(UDFvalue)) {
		   UDFvalue = 0;
		}
		*/
		
		var visits = Math.round(UDFvalue*100)/100;
		
		chart2Data.push({
			date: newDate,
			visits: visits
		});
    }
}

// this method is called when chart2 is first inited as we listen for "dataUpdated" event
function zoomChart2() {
	// different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
	chart2.zoomToIndexes(chart2Data.length - 40, chart2Data.length - 1);
}

/* ------------------------------------------ */
/*         Section 1 - Time Lock in           */
/* ------------------------------------------ */

function locktime() {

  // Overwrite global variables
  df = moment(document.getElementById('time_from').valueAsDate).format('YYYY-MM-DD');
  dt = moment(document.getElementById('time_to').valueAsDate).format('YYYY-MM-DD');
  
  // Disable input
  document.getElementById('timeinput').disabled = true;
  
  // Alert and display
  document.getElementById("timelock").checked = true;
  alert("Time Locked");
  
  date_diff = moment(document.getElementById('time_to').valueAsDate).diff(moment(document.getElementById('time_from').valueAsDate), 'days');
}

/* ------------------------------------------ */
/*         Section 2 - Import Stock           */
/* ------------------------------------------ */

function import_stock() {

   // Check if time is locked in
   if(df==undefined){
      alert("Please lock in the time first");
	  return;
   }
   
   // Check if the stock is already imported
   var stocks = use_functions_bool.stockinfo();
   var IDnumber = document.getElementById('stock_id').value + "." + document.getElementById('stock_country').value;
   
   for (var i in stocks){
      if(stocks[i]==IDnumber){
	     alert(IDnumber + " already imported");
		 return;
	  }
   }
   
   // YQL import stock info from Yahoo Finance
   var json = $.ajax({
					url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22"+ IDnumber +"%22%20and%20startDate%20%3D%20%22" + df + "%22%20and%20endDate%20%3D%20%22" + dt + "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=", // make this url point to the data file
					dataType: 'json',
					async: false
				}).responseText;
     
   var dataarray = JSON.parse(json);
   
   // Alert for invalid ID
   if (dataarray["query"]["count"]==0){
      alert("Invalid ID");
	  return;
   }
   
   dataarray = dataarray["query"]["results"]["quote"];
   
   // Store value for Candle Chart
   stockcount += 1;
   chartStore[stockcount] = dataarray;
   
   // Save data into Parser
   dataarray = dataarray.reverse();
   use_functions_bool.pass_value("data",[dataarray]); // Data need to be reversed
   use_functions_eval.pass_value("data",[dataarray]); // Data need to be reversed
   
   // Display
   document.getElementById("stockinfo").innerHTML = "Imported Stocks: " + use_functions_bool.stockinfo();
   
   // RedSox GoogleChart, update everytime when importing new stocks
   redsoxdates = [];
   for (var i in dataarray){
      redsoxdates[i] = [new Date(moment(dataarray[i]["Date"]).format('YYYY'), moment(dataarray[i]["Date"]).format('M')-1,moment(dataarray[i]["Date"]).format('D')),Number(i)+1];
   }
   
   if ($('#Timelinechart').css('display') != "none"){
      drawRedSoxChart();
   }
   
   // Add Candle Options
   addcandle();
   
   // Plot Candle Chart if not plotted before
   //if(candleplot){
   //   setTimeout(function(){plotcandle();},500);
   //}
   
   // Plot Candle Chart if not plotted before
   //if(redsoxplot){
   //   setTimeout(function(){plotredsox()},500);
   //}
   
   // For adding by stock buy sell amount -> Goto Next Function
   addtradeamt("buy");
   addtradeamt("sell"); 
   
   // Add Data Title
   dataTitle.splice(-4,0,{ "title": "Unit #" + stockcount })
}

function addcandle() {
   var option = document.createElement("option");
   option.text = chartStore[stockcount][0]["Symbol"];
   option.value = stockcount;
   document.getElementById('candleselect').add(option);
}

function addtradeamt(type) {
   
   // div
   var element0 = document.createElement('div');
   
   // Add Text
   var element1 = document.createTextNode("Stock #"+ stockcount +" ");
   
   // Add select 
   var option1 = document.createElement("option");
   option1.text = "Fixed Amount";
   option1.value = "Fixed Amount";
   var option2 = document.createElement("option");
   option2.text = "Cash Ratio";
   option2.value = "Cash Ratio";
   
   var element2 = document.createElement("select");
   element2.setAttribute("id", type + "select" + stockcount);
   element2.setAttribute("class", "form-control");
   element2.setAttribute("style", "width: 40%; display: inline;");
   element2.add(option1);
   element2.add(option2);
   
   // Add amt
   var element3 = document.createElement("input");
   element3.setAttribute("type", "number");
   element3.setAttribute("value", 1000);
   element3.setAttribute("id", type + "amt"+stockcount);
   element3.setAttribute("class", "form-control");
   element3.setAttribute("style", "width: 20%; display: inline;");
   
   // Add br
   var element4 = document.createElement("br");
 
   // Append the element in page
   
   element0.appendChild(element1);
   element0.appendChild(element2);
   element0.appendChild(element3);
   element0.appendChild(element4);
   
   var bar = document.getElementById(type+"bar");
   bar.appendChild(element0);
}

/* ------------------------------------------ */
/*         Section 2a - Export Stock          */
/* ------------------------------------------ */

function export_stock() {


	var exportdata = chartStore[document.getElementById("candleselect").value];
	JSONToCSVConvertor(exportdata, true);


	function JSONToCSVConvertor(JSONData, ShowLabel) {     

		//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
		var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
		var CSV = '';    
		//This condition will generate the Label/Header
		if (ShowLabel) {
		    var row = "";

		    //This loop will extract the label from 1st index of on array
		    for (var index in arrData[0]) {
		        //Now convert each value to string and comma-seprated
		        row += index + ',';
		    }
		    row = row.slice(0, -1);
		    //append Label row with line break
		    CSV += row + '\r\n';
		}

		//1st loop is to extract each row
		for (var i = 0; i < arrData.length; i++) {
		    var row = "";
		    //2nd loop will extract each column and convert it in string comma-seprated
		    for (var index in arrData[i]) {
		        row += '"' + arrData[i][index] + '",';
		    }
		    row.slice(0, row.length - 1);
		    //add a line break after each row
		    CSV += row + '\r\n';
		}

		if (CSV == '') {        
		    alert("Invalid data");
		    return;
		}   

		//this trick will generate a temp "a" tag
		var link = document.createElement("a");    
		link.id="lnkDwnldLnk";

		//this part will append the anchor tag and remove it after automatic click
		document.body.appendChild(link);

		var csv = CSV;  
		blob = new Blob([csv], { type: 'text/csv' }); 
		var csvUrl = window.webkitURL.createObjectURL(blob);
		var filename = 'UserExport.csv';
		$("#lnkDwnldLnk")
		.attr({
		    'download': filename,
		    'href': csvUrl
		}); 

		$('#lnkDwnldLnk')[0].click();    
		document.body.removeChild(link);
	}
}
/* ------------------------------------------ */
/*          Section 3 - Parameters            */
/* ------------------------------------------ */

var capital;
var fc_input;
var vc_input;
var short_allowed;
var cash_floored;
var ruin_on;
  
function lockparameters(){
   capital = Number(document.getElementById("capital").value);				// Initial Capital
   fc_input = Number(document.getElementById("fixed_cost").value);			// Fixed Cost
   vc_input = Number(document.getElementById("variable_cost").value);		// Variable Cost
   short_allowed = document.getElementById("short_allowed").checked;
   cash_floored = document.getElementById("cash_floored").checked;
   ruin_on = document.getElementById("ruin_on").checked;
   
   document.getElementById("capital").disabled = true;
   document.getElementById("fixed_cost").disabled = true;
   document.getElementById("variable_cost").disabled = true;
   document.getElementById("short_allowed").disabled = true;
   document.getElementById("cash_floored").disabled = true;
   document.getElementById("ruin_on").disabled = true;
   document.getElementById("lockpara").disabled = true;
   
   document.getElementById("paralock").checked = true;
   
   alert("Paremeters Locked");
}

/* ------------------------------------------ */
/*           Section 4 - Save UDF             */
/* ------------------------------------------ */

var MOV_AVG = "function MOV_AVG(t,k) {\n   temp = 0;\n   for(i=0;i<k;i++){\n	 temp = temp + Price.adj_close(t-i);\n   }\n   return temp/k ;\n}";
var RSI = "function RSI(t,k){\n  if (t<=k) {\n    return 50;\n  } else {\n    avg_gain = 0;\n    avg_loss = 0;\n    for (i=2;i<=t;i++){\n      delta = Price.adj_close(i) - Price.adj_close(i-1);\n      avg_gain = (avg_gain * (Math.min(i-1,k)-1) + Math.max(delta, 0))/Math.min(i-1,k);\n      avg_loss = (avg_loss * (Math.min(i-1,k)-1) + Math.min(delta, 0))/Math.min(i-1,k);\n    }\n    RS = - avg_gain / avg_loss;\n    return 100 - 100/(1+RS);\n  }\n}";
var MACD = "function MACD(t,k){\n  return MACD;\n}";
	
document.getElementById("UDF").value = MOV_AVG;

function getUDFstring(){
   UDF2.refresh();
   UDF2.setValue(document.getElementById("UDF").value);
}

function saveUDFstring(){
   document.getElementById("UDF").value = UDF2.getValue();
}

function importlibraries(){
   document.getElementById("UDF").value = this[document.getElementById("libraries").value];
}

function save() {
  var x = document.getElementById("UDF").value;
  var txt = "";
  try{def_functions.parse(x);}catch(e){alert(e.message);};
  
  var tempfuncarray = def_functions.exportfuncarray();
  var temprefarray = def_functions.exportrefarray();
  
  use_functions_eval.importfuncarray(tempfuncarray);
  use_functions_eval.importrefarray(temprefarray);
  use_functions_bool.importfuncarray(tempfuncarray);
  use_functions_bool.importrefarray(temprefarray);
  
  document.getElementById("funcinfo").innerHTML = "Saved functions: "+ use_functions_bool.funcinfo();
}

/* ------------------------------------------ */
/*               Section 5 - Run              */
/* ------------------------------------------ */

function run() {

  // Define private variables
 
  var lstra = document.getElementById("long_strategies").value;					// Long Strategies
  var sstra = document.getElementById("short_strategies").value;				// Short Strategies
  var boolean_buy = false;														// Boolean buy condition
  var boolean_sell = false;														// Boolean short condition
  
  var cash = capital;															// Cash holding
  var assetholding = 0;															// Asset Holding
  var tot_asset = capital; 														// Total Asset
  var fc_cost = 0;																// Fixed Cost
  var vc_cost = 0;																// Variable Cost
  var trade_cost = 0;															// Transaction Cost
  
  var tot_trade = 0;															// Total Trade
  var tot_long = 0;																// Total Long
  var tot_short = 0;															// Total Short
  var tot_cost = 0;																// Total Cost
  var tot_fixcost = 0;															// Total Fixed Cost
  var tot_varcost = 0;															// Total Variable Cost
  
  var price = [];																// Stock Price array
  var buyamt = [];																// Buy Amount
  var sellamt = [];																// Sell Amount
  var unit = [];																// Unit holding

  var tempdata = [];															// For Transaction Display
  var dataSet = [];																// For Transaction Display
  
  var UDFdates = [];															// For Chart Display - UDF Dates
  var capitalData = [];															// For Chart Display
  

  for (i=1;i<=stockcount;i++) {
     price[i] = use_functions_bool.stockoutput("ADJ_CLOSE",i);
     buyamt[i] = Number(document.getElementById("buyamt"+i).value);
     sellamt[i] = Number(document.getElementById("sellamt"+i).value);
	 unit[i] = 0;
  }
 
  var ttfrom = 1;															// Time from
  var ttto = price[1].length - 1;	  										// Time to
  
  use_functions_bool.pass_value("max_t", ttto);								// Pass Maximum time into Parser	
  UDFdates = use_functions_bool.stockoutput("DATE",1);						// Get dates information
  
  // Looping from ttfrom to ttto
  for (var curr_t = ttfrom; curr_t <= ttto; curr_t++) {
      
	  // Since data in array start from 0, need to be adjusted
	  var adj_curr_t = curr_t - 1;
	  
	  // Save adj_curr_t into Parser
      use_functions_bool.pass_value("curr_t", adj_curr_t);
	  
	  // Initialize boolean buy and sell
	  boolean_buy = false;
	  boolean_sell = false;
	  
	  // Long Strategies
	  try{boolean_buy = use_functions_bool.parse(lstra);}catch(e){alert(e.message);break;};	  
	  
	  if (boolean_buy == true) {
	     tempdata = [curr_t, "Buy"];
		 assetholding = 0;
		 fc_cost = 0;
		 vc_cost = 0;
		 trade_cost = 0;
	     for (i=1;i<=stockcount;i++) {
	        cash = cash - buyamt[i];
		    unit[i] = unit[i] + buyamt[i]/price[i][adj_curr_t];
		    assetholding = assetholding + unit[i] * price[i][adj_curr_t];
			
			if (buyamt[i] != 0) {
			   fc_cost = fc_cost + fc_input;
			   vc_cost = vc_cost + vc_input * buyamt[i];
			}

			tempdata.push(unit[i].toFixed(2));
		 }
		 trade_cost = fc_cost + vc_cost;
		 tot_asset = cash + assetholding - trade_cost;
		 
		 tot_trade += 1;
		 tot_long += 1;
		 tot_cost += trade_cost;
		 tot_fixcost += fc_cost;
		 tot_varcost += vc_cost;
		 
		 tempdata.push(cash.toFixed(2),assetholding.toFixed(2),trade_cost.toFixed(2),tot_asset.toFixed(2));
		 dataSet.push(tempdata);
	  };
	  
	   // Short Strategies
	  try{boolean_sell = use_functions_bool.parse(sstra);}catch(e){alert(e.message);break;};
	  
	  if (boolean_sell == true) {
	     tempdata = [curr_t, "Sell"];
		 assetholding = 0;
		 fc_cost = 0;
		 vc_cost = 0;
		 trade_cost = 0;
	     for (i=1;i<=stockcount;i++) {
	        cash = cash + sellamt[i];
		    unit[i] = unit[i] - sellamt[i]/price[i][adj_curr_t];
		    assetholding = assetholding + unit[i] * price[i][adj_curr_t];
			
			if (sellamt[i] != 0) {
			   fc_cost = fc_cost + fc_input;
			   vc_cost = vc_cost + vc_input * sellamt[i];
			}
			
			tempdata.push(unit[i].toFixed(2));
		 }
		 trade_cost = fc_cost + vc_cost;
		 tot_asset = cash + assetholding - trade_cost;
		 
		 tot_trade += 1;
		 tot_short += 1;
		 tot_cost += trade_cost;
		 tot_fixcost += fc_cost;
		 tot_varcost += vc_cost;
		 
		 tempdata.push(cash.toFixed(2),assetholding.toFixed(2),trade_cost.toFixed(2),tot_asset.toFixed(2));
		 dataSet.push(tempdata);
	  };

	  var newDate = new Date(UDFdates[adj_curr_t]);
	  
	  capitalData.push({
		 date: newDate,
		 visits: tot_asset
	  });
  }
  
  // Display
  alert("Run Successful!");
  
  var childWin2 = window.open ("result.html","childWin2","menubar=1,resizable=1,width=800,height=600");
  childWin2.dataSet = dataSet;
  childWin2.dataTitle = dataTitle;
  childWin2.capitalData = capitalData;
  childWin2.onload=function(){
	  childWin2.document.getElementById("report_ROR").innerText = ((Math.pow(tot_asset/capital,365/date_diff) - 1)*100).toFixed(2) + "%";
	  childWin2.document.getElementById("report_FC").innerText = tot_asset.toFixed(2);
	  childWin2.document.getElementById("report_tottrade").innerText = tot_trade;
	  childWin2.document.getElementById("report_long").innerText = tot_long;
	  childWin2.document.getElementById("report_short").innerText = tot_short;
	  childWin2.document.getElementById("report_totcost").innerText = tot_cost.toFixed(2);
	  childWin2.document.getElementById("report_fixcost").innerText = tot_fixcost.toFixed(2);
	  childWin2.document.getElementById("report_varcost").innerText = tot_varcost.toFixed(2);
  }
}
