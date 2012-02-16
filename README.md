CartoD3
================

a library for creating D3 graphs from a Backbone.CartoDB model object

usage
-----

First you have to create a CartoDB instance linked to your account

	var CartoDB = Backbone.CartoDB({
        user: 'examples', // you should put your account name here
        table: 'earthquakes' // you should put your account name here
    });


Then you have to define a collection (see backbone.cartodb for other ways):

	var EarthQuakes = CartoDB.CartoDBCollection.extend({
		sql: function() {
        	return "SELECT iso_a3,floor(gdp_md_est / 1000) as gdp_md_est, floor(pop_est / 1000000) as pop_est FROM country_population";
    	}
    });
	var eq = new EarthQuakes();
	
	
Create a new CartoD3 object and pass it your collection definition:

	var CartoD3 = Backbone.CartoD3(eq);
	
	
Tell your CartoD3 what view of the cartodb model you would like to create, including what columns to use for major values (this will require document.ready):

	var bubble = new CartoD3.Bubble({ el: $("#cartodb_d3"), variable: 'pop_est', label: 'iso_a3', fill: 'gdp_md_est'});


examples
--------

Take a look at examples folder

 - examples/barchart.html
 - examples/boxchart.html
 - examples/bubble.html


requirements
------------

The D3 library requires D3, Backbone, and backbone.cartodb.js

Each visualization type requires different D3 extensions see examples

next steps
----------

 - add dom_id parameter to each vis type. this will allow you to register a column (or function to create id) from your backbone.cartodb model as the id to dom for each chart element. then links can be created between the chart and the interactivity layer on a cartodb map

 - allow functions not just column names to be passed as the major parameters of each vis type

 - move the data processing step out of each vis type into a data processing function. each D3 chart type requires different models relative to the cartodb model, update the way i'm creating these

 - implement a bus for the data fetch step. this will allow the user to supply new queries that will change the chart drawing using the D3 map features

 - implement D3 map features for each chart type. 

 - move all charts to a Chart view that just takes a chart type as a parameter

