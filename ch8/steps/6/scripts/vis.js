
var Perfuse_vis = function() {
    this.svg = null;
    this.width = null;
    this.height = null;
    this.x = null;
    this.x2 = null;
    this.y = null;
    this.xAxis = null;
    this.yAxis = null;
    this.globalMax = 0;
}

Perfuse_vis.prototype.redraw_bars = function(data, reset_bars, req_count) {
    var max = d3.max(data, function(d) { return d.value; });
    if (max > this.globalMax) {
        this.globalMax = max;
    };
    var avg = d3.sum(data, function(d) { return d.value; }) / data.length;

    this.y.domain([0, this.globalMax]);
    this.x.domain(data.map(function(d) { return d.host; }));
    this.x2.domain(data.map(function(d) { return d.host; }));
    // uncomment next line to have y axis only grow, never shrink
    //this.y.domain([0, max]);
    this.svg.selectAll("g.x.axis").call(this.xAxis);
    this.svg.selectAll("g.y.axis").call(this.yAxis);

    if (reset_bars) {
        this.svg.selectAll("rect").remove();
        this.svg.selectAll(".bar")
           .data(data)
           .enter().append("rect")
           .attr("class", "bar")
           .attr("x", function(d) { return this.x(d.host); }.bind(this))
           .attr("width", this.x.rangeBand())
           .attr("y", function(d) { return this.y(d.value); }.bind(this))
           .attr("height", function(d) { return this.height - this.y(d.value); }.bind(this));
    }

    this.svg.selectAll("rect")
       .data(data)
       .transition()
       .duration(1000)
       .attr("y", function(d) { return this.y(d.value); }.bind(this))
       .attr("height", function(d) { return this.height - this.y(d.value); }.bind(this));

    if (req_count > 0) {
        // Animate/adjust average line.
        var line = d3.svg.line()
                     .x(function(d, i) {
                            return (typeof this.x2(i) === 'undefined')? 0 : i*this.x2(i) + i 
                        }.bind(this))
                     .y(function(d, i) { return this.y(avg); }.bind(this));
        this.svg.selectAll(".avg-line")
           .datum(data)
           .transition()
           .duration(1000)
           .attr("d", line)
    }
}

Perfuse_vis.prototype.del_bar_chart = function() {
    d3.select("#perf-graph").select("svg").remove();
    this.svg = null;
    this.globalMax = 0;
}

Perfuse_vis.prototype.gen_bar_chart = function(label) {
    var margin = {top: 20, right: 20, bottom: 30, left: 40};

    this.width = 960 - margin.left - margin.right,
    this.height = 500 - margin.top - margin.bottom;

    this.x = d3.scale.ordinal().rangeRoundBands([0, this.width], .1);
    this.x2 = d3.scale.ordinal().rangeBands([0, this.width], 0);
    this.y = d3.scale.linear().range([this.height, 0]);
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");
    this.yAxis = d3.svg.axis().scale(this.y).orient("left");
    // append to hide y axis labels
    //.tickFormat("");

    this.svg = d3.select("#perf-graph").append("svg")
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", this.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + this.height + ")")
       .call(this.xAxis);

    this.svg.append("g")
       .attr("class", "y axis")
       .call(this.yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text(label);

    this.svg.append("path").attr("class", "avg-line")
};
