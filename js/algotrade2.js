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
//	parseData();

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
var RSI = "function RSI(t,k){\n  return RSI;\n}";
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
  
  use_functions_bool.importfuncarray(def_functions.exportfuncarray());
  use_functions_bool.importrefarray(def_functions.exportrefarray());
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
  var tot_asset = capital; 														// Total Asset holding
  var fc_cost = 0;																// Total Fixed Cost
  var vc_cost = 0;																// Total Variable Cost
  var tot_cost = 0;																// Total Transaction Cost;

  var price = [];																// Stock Price array
  var buyamt = [];																// Buy Amount
  var sellamt = [];																// Sell Amount
  var unit = [];																// Unit holding

  var unittxt = "";																// For Display
  var txt = "";																	// For Display

  for (i=1;i<=stockcount;i++) {
     price[i] = use_functions_bool.stockoutput("ADJ_CLOSE",i);
     buyamt[i] = Number(document.getElementById("buyamt"+i).value);
     sellamt[i] = Number(document.getElementById("sellamt"+i).value);
	 unit[i] = 0;
  }
 
  var ttfrom = 1;															// Time from
  var ttto = price[1].length - 1;	  										// Time to
  
  use_functions_bool.pass_value("max_t", ttto);								// Pass Maximum time into Parser	
  
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
	     unittxt = "";
		 assetholding = 0;
		 fc_cost = 0;
		 vc_cost = 0;
		 tot_cost = 0;
	     for (i=1;i<=stockcount;i++) {
	        cash = cash - buyamt[i];
		    unit[i] = unit[i] + buyamt[i]/price[i][adj_curr_t];
		    assetholding = assetholding + unit[i] * price[i][adj_curr_t];
			
			if (buyamt[i] != 0) {
			   fc_cost = fc_cost + fc_input;
			   vc_cost = vc_cost + vc_input * buyamt[i];
			}

			unittxt = unittxt + "Unit #" + i + ": " + unit[i].toFixed(2) + "&emsp;&emsp;";
		 }
		 tot_cost = fc_cost + vc_cost;
		 tot_asset = cash + assetholding - tot_cost;
		 
		 txt = txt + "<br>" + "Time: " + curr_t + "&emsp;&emsp;" + "Buy&emsp;&emsp;" + unittxt + "Cash: "+ cash.toFixed(2) + "&emsp;&emsp;Asset Holding: " + assetholding.toFixed(2) + "&emsp;&emsp;Transaction Cost: " + tot_cost.toFixed(2) + "&emsp;&emsp;Total Asset: " + tot_asset.toFixed(2);
	  };
	  
	   // Short Strategies
	  try{boolean_sell = use_functions_bool.parse(sstra);}catch(e){alert(e.message);break;};
	  
	  if (boolean_sell == true) {
	     unittxt = "";
		 assetholding = 0;
		 fc_cost = 0;
		 vc_cost = 0;
		 tot_cost = 0;
	     for (i=1;i<=stockcount;i++) {
	        cash = cash + sellamt[i];
		    unit[i] = unit[i] - sellamt[i]/price[i][adj_curr_t];
		    assetholding = assetholding + unit[i] * price[i][adj_curr_t];
			
			if (sellamt[i] != 0) {
			   fc_cost = fc_cost + fc_input;
			   vc_cost = vc_cost + vc_input * sellamt[i];
			}
			
			unittxt = unittxt + "Unit #" + i + ": " + unit[i].toFixed(2) + "&emsp;&emsp;";
		 }
		 tot_cost = fc_cost + vc_cost;
		 tot_asset = cash + assetholding - tot_cost;
		 
		 txt = txt + "<br>" + "Time: " + curr_t + "&emsp;&emsp;" + "Sell&emsp;&emsp;" + unittxt + "Cash: "+ cash.toFixed(2) + "&emsp;&emsp;Asset Holding: " + assetholding.toFixed(2) + "&emsp;&emsp;Transaction Cost: " + tot_cost.toFixed(2) + "&emsp;&emsp;Total Asset: " + tot_asset.toFixed(2);
	  };
  }
  
  // Display
  alert("Run Successful!");
  var childWin2 = window.open ("","childWin2","menubar=1,resizable=1,width=350,height=250");
  childWin2.document.write("<p>"+txt+"</p>"); 
}
