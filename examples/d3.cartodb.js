/**
 *
 * d3 cartodb api
 *
 */
Backbone.CartoD3 = function(cartodb) {
    var BarChart = Backbone.View.extend({
		initialize: function(options){
		    /*
		     * TODO: SVG option and support
		     */
			this.bar_height = options.bar_height || 20;
			this.nticks = options.nticks || 10;
			this.font_color = options.font_color || "#fff";
			this.fill_color = options.fill_color || "#4682b4";
			this.ypad = 20;
			this.xpad = 5;
			this.width = options.width || options.el.width() || 420;
			
            this.width = this.width-8; //accounts for padding+margin
            cartodb.fetch();
            this.chart = d3.select(options.el[0]).append("svg")
              .attr("class", "CartoDB_D3 BarChart")
              .attr("width", this.width )
            if (this.options.title){
                // -----------------------------
                // Add Title then Legend
                // -----------------------------
                this.chart.append("text")
                   .attr("x", this.width/4)
                   .attr("y", 20)
                   .style('font-size', 20)
                   .text(this.options.title);
                this.ypad = this.ypad + 30;
            }
            this.chart = this.chart.append("g").attr("transform", "translate("+this.xpad+","+this.ypad+")");
              
            this.labels = {};
            this.data = [];
        
            this.render();
		},
		render: function(){
		    var that = this;
			cartodb.bind('reset',function(){
			    var x, y;
                
                this.each(function(p) {
                    var v = p.get(that.options.variable);
                    that.data.push(v);
                    if(that.options.label){
                        that.labels[v] = p.get(that.options.label);
                    }
                });
                
                that.chart.attr("height", that.bar_height * that.data.length );
                    
                x = d3.scale.linear()
                  .domain([d3.min(that.data), d3.max(that.data)])
                  .range(["20px", that.width - (2*that.ypad) + "px"]);
                  
                y = d3.scale.ordinal()
                    .domain(that.data)
                    .rangeBands([0, that.bar_height * that.data.length ]);
                    
                that.chart.selectAll("line")
                    .data(x.ticks(that.nticks))
                    .enter().append("line")
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", 0)
                    .attr("y2", that.bar_height * that.data.length - 2 * that.xpad)
                    .style("stroke", "#ccc");
                

    			that.chart.selectAll('rect')
    			  .data(that.data)
    			  .enter().append("rect")
    			  .attr("y", y)
    			  .attr("width", x )
    			  .attr("height", y.rangeBand() )
                  .style("fill", that.fill_color);
    			  
    			that.chart.selectAll("text")
    			  .data(that.data)
    			  .enter().append("text")
    			  .attr("x", x)
    			  .attr("y", function(d) { return y(d) + y.rangeBand() / 2; })
    			  .attr("dx", -3) // padding-right
    			  .attr("dy", ".35em") // vertical-align: middle
    			  .attr("text-anchor", "end") // text-align: right
                  .style("stroke", that.font_color)
    			  .text(function(d) { return that.labels[d]; });
    			  
                that.chart.selectAll(".rule")
                    .data(x.ticks(10))
                    .enter().append("text")
                    .attr("class", "rule")
                    .attr("x", x)
                    .attr("y", 0)
                    .attr("dy", -3)
                    .attr("text-anchor", "middle")
    			    .style("fill", "#000")
                    .text(String);
                    
    			that.chart.append("line")
    			    .attr("y1", 0)
    			    .attr("y2", 120)
    			    .style("stroke", "#000");
    			    
            });
		}
    });
    var Bubble = Backbone.View.extend({
		initialize: function(options){
            var width = options.width || options.el.width() || 420;
            var height = options.height || options.el.height() || 420;
            cartodb.fetch();
			this.width = width-8; //accounts for padding+margin
			this.height = height-8;
			this.ypad = 0;
			this.data = [];
			this.labels = {};
            this.format = d3.format(",d");
            this.fill = d3.scale.category20c();
            this.bubble = d3.layout.pack()
                            .sort(null)
                            .size([this.width, this.height]);
            this.vis = d3.select(options.el[0]).append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "CartoDB_D3 Bubble");
            if (this.options.title){
                // -----------------------------
                // Add Title then Legend
                // -----------------------------
                this.vis.append("text")
                   .attr("x", this.width/4)
                   .attr("y", 20)
                   .style('font-size', 20)
                   .text(this.options.title);
                   this.vis.attr("transform", "translate(0,30)");

            }
            this.render();

		},
		render: function(){
		    var that = this;
			cartodb.bind('reset',function(){
			    var x;
                this.each(function(p) {
                    var v = p.get(that.options.variable);
                    that.data.push({
                        value: v, 
                        label: p.get(that.options.label),
                        fill: p.get(that.options.fill)
                    });
                });
                
                var node = that.vis.selectAll("g.node")
                      .data(that.bubble.nodes({children: that.data})
                        .filter(function(d) { return !d.children; }))
                    .enter().append("g")
                      .attr("class", "node")
                      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
                      
                  node.append("title")
                      .text(function(d) { return that.options.variable + ": " + d.value; });
                      
                  node.append("circle")
                      .attr("r", function(d) { return d.r; })
                      .style("fill", function(d) { return that.fill(d.fill); });
                      
                  node.append("text")
                      .attr("text-anchor", "middle")
                      .attr("dy", ".3em")
                      .text(function(d) { return d.label; });
            });
		}
    });
    var BoxPlot = Backbone.View.extend({
		initialize: function(options){
            var width = options.width || options.el.width() || 420;
            var height = options.height || options.el.height() || 420;

            cartodb.fetch();
			this.width = width-8; //accounts for padding+margin
			this.height = height-8;
            this.min = Infinity,
            this.max = -Infinity;
            
			this.data = [];
			this.color = d3.scale.category20c();
			
			this.irq = function(k){
              return function(d, i) {
                var q1 = d.quartiles[0],
                    q3 = d.quartiles[2],
                    iqr = (q3 - q1) * k,
                    i = -1,
                    j = d.length;
                while (d[++i] < q1 - iqr);
                while (d[--j] > q3 + iqr);
                return [i, j];
              };
            }
                            
            this.vis = d3.select(options.el[0])
                .attr("width", width)
                .attr("height", height)
                .attr("class", "CartoDB_D3 BoxChart");
            if (this.options.title){
                // -----------------------------
                // Add Title then Legend
                // -----------------------------
                this.vis.append('div')
                   .attr('width', this.width)
                   .attr('height', 40)
                       .append("text")
                       .attr("x", this.width/4)
                       .attr("y", 20)
                       .style('font-size', 20)
                       .text(this.options.title);
            }

            this.boxchart = d3.chart.box()
                            .whiskers(this.irq(1.5))
            this.render();

		},
		render: function(){
		    var that = this;
			cartodb.bind('reset',function(){
			    var dat = [],
			        groups = {},
			        groups_ct = 0,
			        samples = {},
			        m = [10, 50, 20, 50];
                this.each(function(p) {
                    if (p.get(that.options.group) in groups){
                        var group = groups[p.get(that.options.group)].id;
                    } else {
                        var group = groups_ct;
                        if (!group) group = 0;
                        groups[p.get(that.options.group)] = {id: group, samples: {'null': null}};
                        groups_ct++;
                        
                    }
                    if (p.get(that.options.independent) in groups[p.get(that.options.group)].samples){
                        var sample = groups[p.get(that.options.group)].samples[p.get(that.options.independent)];
                    } else {
                        var sample = groups[p.get(that.options.group)].samples.length;
                        if (!sample) sample = 0;
                        groups[p.get(that.options.group)].samples[p.get(that.options.independent)] = sample;
                    }
                    var e = ~~group,
                        r = ~~sample,
                        s = ~~p.get(that.options.variable),
                        d = that.data[e];
                    if (!d) {
                        d = that.data[e] = [s];
                        //d = that.data[e] = [s];
                    }
                    else that.data[e].push(s);
                    if (s > that.max) that.max = s;
                    if (s < that.min) that.min = s;
                });
                that.boxchart
                    .width(Math.ceil(that.width/groups_ct) - m[1] - m[3])
                    .height(that.height - m[0] - m[2])
                    .domain([that.min,that.max]);
                that.vis.selectAll("svg")
                    .data(that.data)
                    .enter().append("svg")
                      .attr("class", "box")
                      .attr("width", Math.ceil(that.width/groups_ct))
                      .attr("height", that.height - 10)
                    .append("g")
                      .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
                      .call(that.boxchart);
                that.boxchart.duration(1000);
            });
		}
    });
    var LineChart = Backbone.View.extend({
		initialize: function(options){
		    /*
		     * TODO: SVG option and support
		     */
		    // this.bar_height = options.bar_height || 20;
		    // this.nticks = options.nticks || 10;
			this.font_color = options.font_color || "#fff";
			this.fill_color = options.fill_color || "#4682b4";
			this.colorlist = ["maroon", "darkblue"];
			
			this.labelpad = 100;
			this.width = options.width || options.el.width() || 420;
			this.height = options.height || options.el.height() || 420;
            this.width = this.width-28; //accounts for padding+margin
            this.height = this.height-28; //accounts for padding+margin
            this.height = 150;
            
            cartodb.fetch();

            this.vis;

            this.labels = {};
            this.data = {};
        
            this.render();
		},
		render: function(){
		    var that = this;
			cartodb.bind('reset',function(){
			    var x, y
                    sampsize = 0,
                    maxval = -Infinity,
                    maxind = -Infinity,
                    minval = Infinity,
                    minind = Infinity,
                    strokes = {};
                var label_array = new Array(),
                    val_array1 = new Array();
                
                var stroke_defaults = [, 'darkblue', 'maroon','black', 'orange', 'purple', 'green','red', 'yellow', 'darkblue', 'maroon','black'];
                this.each(function(p) {
                    var g = that.data[p.get(that.options.group)] || [];
                    var a = {};
                    strokes[p.get(that.options.group)] = strokes[p.get(that.options.group)] || stroke_defaults.pop();
                    //console.log(a)
                    a[that.options.group] = a[that.options.group] || p.get(that.options.group);
                    a[that.options.independent] = a[that.options.independent] || p.get(that.options.independent);
                    a[that.options.variable] = a[that.options.variable] || p.get(that.options.variable);
                    a[that.options.label] = a[that.options.label] || p.get(that.options.label);
                    
                    g.push(a);
                    
                    that.data[p.get(that.options.group)] = g;
                    
                    minval = Math.min(a[that.options.variable],minval);
                    minind = Math.min(a[that.options.independent],minind);
                    maxval = Math.max(a[that.options.variable],maxval);
                    maxind = Math.max(a[that.options.independent],maxind);
                });
                for (var i in that.data) {
                    sampsize = Math.max(sampsize, that.data[i].length);
                }
                //that.data = [23, 85, 67, 38, 70, 30, 80, 18 ];

                /* Read CSV file: first row =>  year,top1,top5  */

                // 
                // for (var i=0; i < sampsize; i++) {
                //    label_array[i] = parseInt(that.data[i][that.options.independent]);
                //    val_array1[i] = { x: label_array[i], y: parseFloat(data1[i][that.options.variable]), z: parseFloat(data1[i][that.options.variable]) };
                //    maxval = Math.max(maxval, parseFloat(data1[i][that.options.variable]), parseFloat(data1[i][that.options.variable]) );
                //  }
                 
                 maxval = (1 + Math.floor(maxval / 10)) * 10;   
                 
               var  w = 815,
                    h = 500,
                    yp = 10,
                    xp = 80;
                that.vis = d3.select(that.options.el[0])
                    .data([that.data['Brazil']])
                     .append("svg:svg")
                       .attr("width", w + xp )
                       .attr("height", h + yp )
                     .append("svg:g")
                       .attr("transform", "translate(" + xp + "," + yp + ")");
                x = d3.scale.linear().domain([minind,maxind]).range([0, w]),
                y = d3.scale.linear().domain([minval,maxval]).range([h, 0]);

               var rules = that.vis.selectAll("g.rule")
                  .data(x.ticks(15))
                 .enter().append("svg:g")
                   .attr("class", "rule");

               // Draw grid lines
               rules.append("svg:line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("y1", 0)
                .attr("y2", h - 1);

               rules.append("svg:line")
                .attr("class", function(d) { return d ? null : "axis"; })
                .data(y.ticks(10))
                .attr("y1", y)
                .attr("y2", y)
                .attr("x1", 0)
                .attr("x2", w - 10);

               // Place axis tick labels
               rules.append("svg:text")
                .attr("x", x)
                .attr("y", h + 15)
                .attr("dy", ".71em")
                .attr("text-anchor", "middle")
                .text(x.tickFormat(10))
                .text(String);

               rules.append("svg:text")
                .data(y.ticks(12))
                .attr("y", y)
                .attr("x", -10)
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .text(y.tickFormat(5));
                
                for (var group in that.data) {
                   var line = d3.svg.line()
                         .x(function(d) { return x(d[that.options.independent]) })
                         .y(function(d) { return y(d[that.options.variable]) });
                   that.vis.selectAll("circle."+group+"-line")
                       .data(that.data[group])
                     .enter().append("svg:circle")
                       .attr("class", group+"-line")
                       .attr("fill",strokes[group])
                       .attr("cx", function(d) { return x(d[that.options.independent]) })
                       .attr("cy", function(d) { return y(d[that.options.variable]) })
                       .attr("r", 1);
                   // Series I
                   that.vis.append("svg:path")
                       .attr("class", group+"-path")
                       .attr("fill", "none")
                       .attr("stroke", strokes[group])
                       .attr("stroke-width", 3)
                       .attr("d", line(that.data[group]));
                
                }
                
               // -----------------------------
               // Add Title then Legend
               // -----------------------------
               if (that.options.title){
                   that.vis.append("svg:text")
                       .attr("x", w - w/4 - 50)
                       .attr("y", 20 - yp)
                       .text(that.options.title);
               }
               if (that.options.subtitle){
                   that.vis.append("svg:text")
                       .attr("x", w - w/4)
                       .attr("y", 42 - yp)
                       .text(that.options.subtitle);
               }
               var yoff = 0;
               for (var group in that.data) {
                   that.vis.append("svg:rect")
                       .attr("x", w/10 - 20)
                       .attr("y", 50 + yoff)
                       .attr("stroke", strokes[group])
                       .attr("height", 2)
                       .attr("width", 40);
               
                   that.vis.append("svg:text")
                       .attr("x", 30 + w/10)
                       .attr("y", 55 + yoff)
                       .text(that.data[group][0][that.options.label]);
                   yoff = yoff+30;
               }
               // that.vis.append("svg:rect")
               //     .attr("x", w/10 - 20)
               //     .attr("y", 80)
               //     .attr("stroke", "maroon")
               //     .attr("height", 2)
               //     .attr("width", 40);
               // 
               // that.vis.append("svg:text")
               //     .attr("x", 30 + w/10)
               //     .attr("y", 85)
               //     .text("United States");


            });
            
		}
    });
    
    
    return {
      BarChart: BarChart,
      LineChart: LineChart,
      Bubble: Bubble,
      BoxPlot: BoxPlot
    };
};