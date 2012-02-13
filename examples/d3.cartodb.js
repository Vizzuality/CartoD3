
/**
 *
 * d3 cartodb api
 *
 */

Backbone.CartoD3 = function(cartodb) {
    var Barchart = Backbone.View.extend({
		initialize: function(options){
		    /*
		     * TODO: SVG option and support
		     */
			this.width = options.width || $("#"+options.container).width() || 420;
            this.width = this.width-8; //accounts for padding+margin
            cartodb.fetch();
            this.chart = d3.select("#"+options.container)
              .attr("class", "CartoDB_D3 Barchart");
            this.labels = {};
            this.data = [];
        
            this.render();
		},
		render: function(){
		    var that = this;
			cartodb.bind('reset',function(){
			    var x;
                
                this.each(function(p) {
                    var v = p.get(that.options.variable);
                    that.data.push(v);
                    if(that.options.label){
                        that.labels[v] = p.get(that.options.label);
                    }
                });
                
                x = d3.scale.linear()
                  .domain([d3.min(that.data), d3.max(that.data)])
                  .range(["20px", that.width+"px"]);
                
    			that.chart.selectAll('div')
    			  .data(that.data)
    			  .enter().append("div")
    			  .style("width", x)
    			  .text(function(d) { return that.labels[d]; });
    			  
            });
		}
    });
    
    var BubbleSVG = Backbone.View.extend({
		initialize: function(options){
            var width = options.width || $("#"+options.container).width() || 420;
            cartodb.fetch();
			this.width = width-8; //accounts for padding+margin
			this.data = [];
			this.labels = {};
            this.format = d3.format(",d");
            this.fill = d3.scale.category20c();
            this.bubble = d3.layout.pack()
                            .sort(null)
                            .size([width, width]);
            this.vis = d3.select("#"+options.container).append("svg")
                .attr("width", width)
                .attr("height", width)
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
    
    return {
      Barchart: Barchart,
      BubbleSVG: BubbleSVG
    };
};
