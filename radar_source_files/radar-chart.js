//some changes taken from: http://bl.ocks.org/nbremer/6506614

//wraps text to a new line if longer than width
//source: http://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, //ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = 0.32,
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    })
}

var RadarChart = {
  defaultConfig: {
    containerClass: 'radar-chart',
    w: 600,
    h: 600,
    factor: 0.95,
    factorLegend: 1,
    levels: 3,
    levelTick: true,
    TickLength: 10,
    maxValue: 0,
    radians: 2 * Math.PI,
    color: d3.scale.category10(),
    axisLine: true,
    axisText: true,
    circles: true,
    radius: 5,
    translateX: 0,
    translateY: 0,
    extraWidthX: 0,
    extraWidthY: 0,
    axisJoin: function(d, i) {
      return d.className || i;
    },
    transitionDuration: 300
  },

  chart: function() {
    // default config
    var cfg = Object.create(RadarChart.defaultConfig);
    
    function radar(selection) {
      selection.each(function(data) {
        var container = d3.select(this);

        // allow simple notation
        data = data.map(function(datum) {
          if(datum instanceof Array) {
            datum = {axes: datum};
          }

          return datum;
        });

        var maxValue = Math.max(cfg.maxValue, d3.max(data, function(d) {
          return d3.max(d.axes, function(o){ return o.value; });
        }));

        var allAxis = data[0].axes.map(function(i, j){ return {name: i.axis, xOffset: (i.xOffset)?i.xOffset:0, yOffset: (i.yOffset)?i.yOffset:0}; });
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var radius2 = Math.min(cfg.w / 2, cfg.h / 2);

        container.classed(cfg.containerClass, 1);

        function getPosition(i, range, factor, func) {
          factor = typeof factor !== 'undefined' ? factor : 1;
          return range * (1 - factor * func(i * cfg.radians / total));
        }

        function getHorizontalPosition(i, range, factor) {
          return getPosition(i, range, factor, Math.sin);
        }

        function getVerticalPosition(i, range, factor) {
          return getPosition(i, range, factor, Math.cos);
        }

        // levels && axises
        var levelFactors = d3.range(0, cfg.levels).map(function(level) {
          return radius * ((level + 1) / cfg.levels);
        });

        var levelGroups = container.selectAll('g.level-group').data(levelFactors);

        levelGroups.enter().append('g');
        levelGroups.exit().remove();

        levelGroups.attr('class', function(d, i) {
          return 'level-group level-group-' + i;
        });

        var levelLine = levelGroups.selectAll('.level').data(function(levelFactor) {
          return d3.range(0, total).map(function() { return levelFactor; });
        });

        levelLine.enter().append('line');
        levelLine.exit().remove();

        if (cfg.levelTick){
          levelLine
          .attr('class', 'level')
          .attr('x1', function(levelFactor, i){
            if (radius == levelFactor) {
              return getHorizontalPosition(i, levelFactor);
            } else {
              return getHorizontalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
            }
          })
          .attr('y1', function(levelFactor, i){
            if (radius == levelFactor) {
              return getVerticalPosition(i, levelFactor);
            } else {
              return getVerticalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
            }
          })
          .attr('x2', function(levelFactor, i){
            if (radius == levelFactor) {
              return getHorizontalPosition(i+1, levelFactor);
            } else {
              return getHorizontalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
            }
          })
          .attr('y2', function(levelFactor, i){
            if (radius == levelFactor) {
              return getVerticalPosition(i+1, levelFactor);
            } else {
              return getVerticalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
            }
          })
          .attr('transform', function(levelFactor) {
            return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
          });
        }
        else{
          levelLine
          .attr('class', 'level')
          .attr('x1', function(levelFactor, i){ return getHorizontalPosition(i, levelFactor); })
          .attr('y1', function(levelFactor, i){ return getVerticalPosition(i, levelFactor); })
          .attr('x2', function(levelFactor, i){ return getHorizontalPosition(i+1, levelFactor); })
          .attr('y2', function(levelFactor, i){ return getVerticalPosition(i+1, levelFactor); })
          .attr('transform', function(levelFactor) {
            return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
          });
        }
        if(cfg.axisLine || cfg.axisText) {
          var axis = container.selectAll('.axis').data(allAxis);

          var newAxis = axis.enter().append('g');
          if(cfg.axisLine) {
            newAxis.append('line');
          }
          if(cfg.axisText) {
            newAxis.append('text');
          }

          axis.exit().remove();

          axis.attr('class', 'axis');

          if(cfg.axisLine) {
            axis.select('line')
              .attr('x1', cfg.w/2)
              .attr('y1', cfg.h/2)
              .attr('x2', function(d, i) { return (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factor); })
              .attr('y2', function(d, i) { return (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factor); });
          }

          if(cfg.axisText) {

            //adjust labels based on their bounding boxes and the available space if there are four output values 
            if (allAxis.length == 4) {
              axis.select('text')
                .attr('class', function(d, i){
                  var p = getHorizontalPosition(i, 0.5);
                  var v = getVerticalPosition(i, 0.5);

                  return 'rclegend ' +
                    ((p < 0.4) ? 'left ' : ((p > 0.6) ? 'right ' : 'middle ')) +
                    ((v < 0.4) ? 'top' : ((v > 0.6) ? 'bottom' : 'middle'));
                })
                .attr('dy', function(d, i) {
                  var p = getVerticalPosition(i, 0.5);
                  return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
                })
                .text(function(d) { return d.name; })
                .attr('x', function(d, i){ return d.xOffset+ (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factorLegend); })
                .attr('y', function(d, i){ return d.yOffset+ (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factorLegend); });

              d3.select("#radarChart").selectAll(".rclegend").filter(".left").call(wrap, cfg.extraWidthX / 2);
              d3.select("#radarChart").selectAll(".rclegend").filter(".right").call(wrap, cfg.extraWidthX / 2);
              d3.select("#radarChart").selectAll(".rclegend").filter(".top").call(wrap, 50);
              d3.select("#radarChart").selectAll(".rclegend").filter(".bottom").call(wrap, 50);

              //use get bounding box for each text group
              var bboxTop = d3.select("#radarChart").selectAll(".rclegend").filter(".top").node().getBBox();
              var bboxLeft = d3.select("#radarChart").selectAll(".rclegend").filter(".left").node().getBBox();
              var bboxBottom = d3.select("#radarChart").selectAll(".rclegend").filter(".bottom").node().getBBox();
              var bboxRight = d3.select("#radarChart").selectAll(".rclegend").filter(".right").node().getBBox();
              var bboxContainer = d3.select(".radar-chart").node().getBBox();

              //transform each off of axis: padding of 3px, center the left and right labels
              if (bboxContainer.y == bboxTop.y) { // in case of overflow
                var paddingTop = 0;
              } else {
                var paddingTop = 3;
              }

              if (bboxContainer.x == bboxLeft.x) { // in case of overflow
                var paddingLeft = 0;
              } else {
                var paddingLeft = 3;
              }

              if (bboxBottom.y == bboxContainer.y) { // in case of overflow
                var paddingBottom = 0;
              } else {
                var paddingBottom = 3;
              }

              if (bboxRight.x == bboxContainer.x) { // in case of overflow
                var paddingRight = 0;
              } else {
                var paddingRight = 3;
              }

              var yDiffTop = (cfg.w/2-radius2)+getVerticalPosition(0, radius2, cfg.factor) - (bboxTop.y + bboxTop.height)
              d3.select("#radarChart").selectAll(".rclegend").filter(".top")
                .attr("transform", "translate(0," + (yDiffTop - paddingTop) + ")");
            
              var yDiffBottom = bboxBottom.y - ((cfg.h/2-radius2)+getVerticalPosition(2, radius2, cfg.factor));
              d3.select("#radarChart").selectAll(".rclegend").filter(".bottom")
                .attr("transform", "translate(0," + (paddingBottom - yDiffBottom) + ")");
            
              var xDiffLeft = ((cfg.w/2-radius2)+getHorizontalPosition(1, radius2, cfg.factor)) - (bboxLeft.x + bboxLeft.width);
              var yDiffLeft = (bboxLeft.y + (bboxLeft.height / 2)) - ((cfg.h/2-radius2)+getVerticalPosition(1, radius2, cfg.factor));
              d3.select("#radarChart").selectAll(".rclegend").filter(".left")
                .attr("transform", "translate(" + (xDiffLeft - paddingLeft) + "," + (-yDiffLeft) + ")");
              
              var xDiffRight = bboxRight.x - ((cfg.w/2-radius2)+getHorizontalPosition(3, radius2, cfg.factor));
              var yDiffRight = (bboxRight.y + (bboxRight.height / 2)) - ((cfg.h/2-radius2)+getVerticalPosition(3, radius2, cfg.factor));
              d3.select("#radarChart").selectAll(".rclegend").filter(".right")
                .attr("transform", "translate(" + (paddingRight - xDiffRight) + "," + (-yDiffRight) + ")");
            } else {
                axis.select("text")
                  .attr("class", "rclegend")
                  .text(function(d){ return d.name; })
                  .attr("text-anchor", "middle")
                  .attr("dy", "1.5em")
                  .attr("transform", function(d, i){return "translate(0, -10)"})
                  .attr("x", function(d, i){ return (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factor); })
                  .attr("y", function(d, i){ return (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factor); })
                  .each(function(d, i) {
                    var wrappedText = d3.select(this).call(wrap, 45); //change this
                    var bbox = wrappedText.node().getBBox();
                    var yTarget = (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factor);
                    wrappedText.attr("transform", "translate(" + ((bbox.width / 2) * Math.cos((i+1)*cfg.radians/total)) + "," + 
                      (-(bbox.height / 2) * (Math.sin(i+1)*cfg.radians/total)) + ")");
                  })
                }
            }
        }

        // content
        data.forEach(function(d){
          d.axes.forEach(function(axis, i) {
            axis.x = (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, (parseFloat(Math.max(axis.value, 0))/maxValue)*cfg.factor);
            axis.y = (cfg.h/2-radius2)+getVerticalPosition(i, radius2, (parseFloat(Math.max(axis.value, 0))/maxValue)*cfg.factor);
          });
        });

        var polygon = container.selectAll(".area").data(data, cfg.axisJoin);

        polygon.enter().append('polygon')
          .classed({area: 1, 'd3-enter': 1});

        polygon.exit()
          .classed('d3-exit', 1) // trigger css transition
          .transition().duration(cfg.transitionDuration)
            .remove();
        
        polygon
          .attr("id", function(d) { return d.className; })
          .each(function(d, i) {
            var classed = {'d3-exit': 0}; // if exiting element is being reused
            classed['radar-chart-serie' + i] = 1;
            if(d.className) {
              classed[d.className] = 1;
            }
            d3.select(this).classed(classed);
          })
          // styles should only be transitioned with css
          .style('stroke', function(d, i) { return cfg.color(i); })
          .style('fill', function(d, i) { return cfg.color(i); })
          .transition().duration(cfg.transitionDuration)
            // svg attrs with js
            .attr('points',function(d) {
              return d.axes.map(function(p) {
                return [p.x, p.y].join(',');
              }).join(' ');
            })
            .each('start', function() {
              d3.select(this).classed('d3-enter', 0); // trigger css transition
            });

        if(cfg.circles && cfg.radius) {

          var circleGroups = container.selectAll('g.circle-group').data(data, cfg.axisJoin);

          circleGroups.enter().append('g').classed({'circle-group': 1, 'd3-enter': 1});
          circleGroups.exit()
            .classed('d3-exit', 1) // trigger css transition
            .transition().duration(cfg.transitionDuration).remove();

          circleGroups
            .each(function(d) {
              var classed = {'d3-exit': 0}; // if exiting element is being reused
              if(d.className) {
                classed[d.className] = 1;
              }
              d3.select(this).classed(classed);
            })
            .transition().duration(cfg.transitionDuration)
              .each('start', function() {
                d3.select(this).classed('d3-enter', 0); // trigger css transition
              });

          var circle = circleGroups.selectAll('.circle').data(function(datum, i) {
            return datum.axes.map(function(d) { return [d, i]; });
          });

          circle.enter().append('circle')
            .classed({circle: 1, 'd3-enter': 1});

          circle.exit()
            .classed('d3-exit', 1) // trigger css transition
            .transition().duration(cfg.transitionDuration).remove();

          circle
            .each(function(d) {
              var classed = {'d3-exit': 0}; // if exit element reused
              classed['radar-chart-serie'+d[1]] = 1;
              d3.select(this).classed(classed);
            })
            // styles should only be transitioned with css
            .style('fill', function(d) { return cfg.color(d[1]); })
            .transition().duration(cfg.transitionDuration)
              // svg attrs with js
              .attr('r', cfg.radius)
              .attr('cx', function(d) {
                return d[0].x;
              })
              .attr('cy', function(d) {
                return d[0].y;
              })
              .each('start', function() {
                d3.select(this).classed('d3-enter', 0); // trigger css transition
              });
          
          //Make sure layer order is correct
          var poly_node = polygon.node();
          poly_node.parentNode.appendChild(poly_node);

          var cg_node = circleGroups.node();
          cg_node.parentNode.appendChild(cg_node);
          
        }

      });
    }

    radar.config = function(value) {
      if(!arguments.length) {
        return cfg;
      }
      if(arguments.length > 1) {
        cfg[arguments[0]] = arguments[1];
      } else {
        d3.entries(value || {}).forEach(function(option) {
          cfg[option.key] = option.value;
        });
      }
      return radar;
    };

    //highlight an array of data
    radar.highlight = function(data) {
        
        //dim all other lines
        d3.selectAll(".area")
          .style("stroke", "rgb(200,200,200)")
          .style("stroke-width", 1);

        //move all other  lines to back
        d3.selectAll(".area").moveToBack();

        data.forEach(function(d) {
          //highlight data lines
          d3.selectAll("#" + getID(d))
            .moveToFront()
            .style("stroke", "grey")
            .style("stroke-width", 3);
        })
    }

    //unhighlight the radar chart
    radar.unhighlight = function() {

      //back to normal
      d3.selectAll(".area")
        .style("stroke", radarGrey)
        .style("stroke-width", 1);

      //move all level lines to back
      d3.selectAll(".area").moveToBack();

    }

    //shows only polygons bound to data
    radar.updateData = function(data) {

      d3.selectAll(".area").attr("visibility", "hidden");

      data.forEach(function(d) {
        d3.selectAll("#" + getID(d)).attr("visibility", "shown");
      })

      graph.highlighted().forEach(function(d) {
        d3.selectAll("#" + getID(d)).attr("visibility", "shown");
      })

    }

    return radar;
  },

  draw: function(id, d, options) {
    rc = RadarChart.chart().config(options);
    var cfg = rc.config();

    d3.select(id).select('svg').remove();

    var g = d3.select(id)
      .append("svg")
      .attr("width", cfg.w + cfg.extraWidthX)
      .attr("height", cfg.h + cfg.extraWidthY)
      .append("g")
      .attr("transform", "translate(" + cfg.translateX + "," + cfg.translateY + ")")
      .datum(d)
      .call(rc);
  }

};

//remove white space from a string
//http://stackoverflow.com/questions/5964373/is-there-a-difference-between-s-g-and-s-g
function removeWhiteSpace(str) {
    return str.replace(/\s+/g, "");
} 

//remove parenthesis from a string
function removeParentheses(str) {
    return str.replace(/[()]/g, "");
}

//remove + from a string
function removePlusSign(str) {
    return str.replace(/\++/g, "");
}

//remove & from a string
function removeAmpersand(str) {
    return str.replace(/\&+/g, "");
}

//remove / from a string
function removeSlash(str) {
    return str.replace(/\/+/g, "");
}

//remove . from a string
function removePeriod(str) {
    return str.replace(/\.+/g, "");
}

//remove % from a string
function removePercent(str) {
    return str.replace(/\%+/g, "");
}

function cleanString(str) {
    return removeWhiteSpace(removeParentheses(removePlusSign(removeAmpersand(removeSlash(removePeriod(removePercent(str)))))));
}

//unique id for each 
function getID(d) {
  var id = "polygon";
  var keys = d3.keys(outputData[0]);

  keys.forEach(function(key) {
    id += "_" + cleanString(d[key].toString());
  })

  return id;
}

//format data
function formatData(d) {
  var axesData = [],
    keys = d3.keys(outputData[0]);

  keys.forEach(function(key) {
      var scale = d3.scale.linear()
        .domain([d3.min(graph.data(), function(d) { return parseFloat(d[key]); }), d3.max(graph.data(), function(d) { return parseFloat(d[key]); })])
        .range([0, 100]);

      axesData.push({
        axis: key,
        value: scale(parseFloat(d[key]))
      })
  })

  return {className: getID(d), axes: axesData};
}

//moves selection to the front of the DOM
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

//moves selectin to the back of the DOM
d3.selection.prototype.moveToBack = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    }); 
};

