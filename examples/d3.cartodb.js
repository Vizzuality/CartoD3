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
			this.ypad = 10;
			this.xpad = 5;
			this.width = options.width || options.el.width() || 420;
			
            this.width = this.width-8; //accounts for padding+margin
            cartodb.fetch();
            this.chart = d3.select(options.el[0]).append("svg")
              .attr("class", "CartoDB_D3 BarChart")
              .attr("width", this.width )
              .append("g").attr("transform", "translate("+this.xpad+","+this.ypad+")");
              
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
			this.data = [];
			this.labels = {};
            this.format = d3.format(",d");
            this.fill = d3.scale.category20c();
            this.bubble = d3.layout.pack()
                            .sort(null)
                            .size([width, height]);
            this.vis = d3.select(options.el[0]).append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "CartoDB_D3 Bubble");

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
                .attr("class", "CartoDB_D3 BoxChart");

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
                    if (p.get(that.options.sample) in groups[p.get(that.options.group)].samples){
                        var sample = groups[p.get(that.options.group)].samples[p.get(that.options.sample)];
                    } else {
                        var sample = groups[p.get(that.options.group)].samples.length;
                        if (!sample) sample = 0;
                        groups[p.get(that.options.group)].samples[p.get(that.options.sample)] = sample;
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
    
    return {
      Barchart: Barchart,
      Bubble: Bubble,
      BoxPlot: BoxPlot
    };
};
