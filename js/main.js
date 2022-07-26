
//get year
var GET = {};
var query = window.location.search.substring(1).split("&");
for (var i = 0, max = query.length; i < max; i++) {
    if (query[i] === "") // check for trailing & with no param
        continue;
    var param = query[i].split("=");
    GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
}
year = 2022;
var treeViz = (function ($) {
	var _self = {},
		redrawTimer,
		boroughs,
		treeData,
		currentSort = "Common",
		colors = ["334d5c","45b29e","efc94c","e27a3f","df4949","aeaeae","776355","57385c","4edaef","8db500"]
		barTemplate = '<div class="bar_wrapper cf"><div class="bar" style="width:100%;"><div class="bg"></div></div>\
                        <div class="meta">\
                            <span class="count"></span>\
                            <span class="location"></span>\
                        </div>\
                       </div></div>',
        treeTemplate = '<li><div><span class="Common"></span><span class="Latin"></span><em></em></div></li>';

    function resizeCanvas() {
    	var viz = $('#viz_wrapper'),
    		canvas = $('#tree_canvas, #hover_canvas').attr("width",viz.outerWidth()).attr("height",viz.outerHeight());
    }

    function formatNumber(number) {
    	var strng = number.toString();
    	if (strng.length > 3) {
 			strng = (strng.slice(0,strng.length - 3) + ',' + strng.slice((strng.length - 3), Math.abs(strng.length)))
	    }
    	return strng;
    }

	function initBars() {
		var total = [],
			max_of_array;

		$.each(boroughs, function(){
			total.push(this.total);
		}); 
		max_of_array = Math.max.apply(Math, total);

		$.each(boroughs, function(index){
			var snippet = $(barTemplate),
				widthPercent = ((this.total / max_of_array) * 100).toFixed(2);
			snippet
				.find('.count').html("0%<br>0").end()
				.find(".location").html('<em>'+ this.name +'</em><br>' + formatNumber(this.total)).end()
				.find('.bar').attr("id", "borough-" + index).end()
				.css({"width": widthPercent + '%'})
				.appendTo('#bars');
		});
		resizeCanvas();
	}

	function initTrees() {
		var treeList = $('#trees_grid').find('ul');
		$.each(treeData, function(index){
			var template = $(treeTemplate);
			template
				.css("background-color", "#" + this.color)
				.find('.Common').text(this.Common).end()
				.find('.Latin').text(this.Latin).end()
				.find('div').css("background-image","url(trees/"+ this.file +")").end()
				.attr('id', 'tree-' + index)
				.appendTo(treeList);
			processTree(this, index);
		});
		resizeCanvas();
		$('.tooltip').tooltipster();
	}

	function processTree(tree, tree_index) {
		$.each(boroughs, function(index){
			var bar = $("#borough-" + index),
				widthPercent = ((tree[this.name] / this.total) * 100).toFixed(6),
				treeSpan = $('<span title="' + tree[currentSort] + ' : ' + formatNumber(tree[this.name]) + ' " data-tree="tree-' + tree_index + '" class="tree-' + tree_index + ' tooltip"></span>');

			treeSpan.data('count', tree[this.name]);
			treeSpan.width(widthPercent + "%").css('background-color', "#" + tree["color"]);
			bar.append(treeSpan);
		}); 
	}

	function loadTreeData() {
		var trees = $.getJSON( "data-"+year+"/common.json", function(data) {
			treeData = data;
			initTrees();
			resizeCanvas();
		});
	}

	function loadBoroughData() {
		var temp = $.getJSON( "data-"+year+"/boroughs.json", function(data) {
			boroughs = data;
			initBars();
			loadTreeData();
		});
	}

	function getArea(spanA, spanB) {

		var vizOffset =  $('#viz_wrapper').offset(),
			spanAOffset = $(spanA).offset(),
			spanBOffset = $(spanB).offset(),
			spanASize = {"width": $(spanA).width(), "height" : $(spanA).height()},
			spanBSize = {"width": $(spanB).width(), "height" : $(spanB).height()},
			pos1Y = spanAOffset.top + spanASize.height - vizOffset.top,
		    pos1X = spanAOffset.left - vizOffset.left,
		    pos2Y = spanAOffset.top + spanASize.height - vizOffset.top,
		    pos2X = spanAOffset.left + spanASize.width - vizOffset.left,
		    pos3Y = spanBOffset.top - vizOffset.top,
		    pos3X = spanBOffset.left + spanBSize.width - vizOffset.left,
		    pos4Y = spanBOffset.top - vizOffset.top,
		    pos4X = spanBOffset.left - vizOffset.left;

		return [pos1X, pos1Y, pos2X, pos2Y, pos3X, pos3Y, pos4X, pos4Y];

	}
	function connectSections(sections, tree, canvas) {

		$.each(sections, function(index){
			var nextItem = sections[index + 1];
			if ((index + 1) == sections.length) {
				nextItem = tree;
			}
			var points = getArea(sections[index], nextItem);
			$( canvas ).drawPath({
			  fillStyle: $(sections[index]).css("background-color"),
			  strokeWidth: 1,
			  p1: {
			    type: 'line',
			    x1: points[0], y1: points[1],
			    x2: points[2], y2: points[3],
			    x3: points[4], y3: points[5],
			    x4: points[6], y4: points[7]
			  }
			});
		});
	}

	function updateBarCounts() {
		var arr_boroughs = [];
		$.each(boroughs, function(index){
			var bar = $("#borough-" + index),
				trees = bar.find('.selected'),
				count = 0,
				percent = 0,
				boroughTotal = this.total;

			trees.each(function(){
				count += parseInt($(this).data('count'));
			});
			percent = ((count / boroughTotal) * 100).toFixed(2);
			bar.parent().find('.count').html(percent + '%<br>' + formatNumber(count));

			arr_boroughs.push(count);
		});

		// Get the names of the selected trees and the sizes
		var tree_names_selected = [];

		var trees_selected = document.querySelector('ul').querySelectorAll('.selected');
		var arr_trees_selected = Array.prototype.slice.call(trees_selected);

		if (arr_trees_selected.length > 0) {
			for (var i = 0; i < arr_trees_selected.length; i++) {
				tree_names_selected[i] = arr_trees_selected[i].id;
			}
			var trees_north_york = [];
			var trees_etobicoke = [];
			var trees_toronto = [];
			var trees_scarborough = [];

			function allocateTreesByArea(arrTrees, area) {
				tree_names_selected.forEach(replaceIdToName)
				function replaceIdToName(item, index, arr) {
					var tree_index = parseInt(item.split("-")[1]);
					// arr[index] = treeData[tree_index].Common;
					var name_n_size = {
						name: treeData[tree_index]['Common'],
						size: parseInt(treeData[tree_index][area]),
					};
					arrTrees[index] = name_n_size;
				}
			}

			allocateTreesByArea(trees_north_york, 'North York');
			allocateTreesByArea(trees_etobicoke, 'Etobicoke York');
			allocateTreesByArea(trees_toronto, 'Toronto and East York');
			allocateTreesByArea(trees_scarborough, 'Scarborough');

			createEmptyTreesJSON();
			createTreesJSON(trees_north_york, 
				trees_etobicoke, 
				trees_toronto, 
				trees_scarborough);

		} else {
			drawCirclePacking(empty_trees);
		}


	}

	function connectTrees() {
		$('#tree_canvas').clearCanvas();
		$('#bars .selected').removeClass('selected');
		$( "#trees_grid .selected" ).each(function(){
			var sections = $('#bars').find('.' + $( this ).attr('id')).toggleClass('selected');
		  	connectSections(sections, this, '#tree_canvas');
		  	
		});
		updateBarCounts();
	}

	function hilightTree(tree) {
		$('#hover_canvas').clearCanvas();
		
		var sections = $('#bars').find('.' + $( tree ).attr('id'));
		$( tree ).addClass('hover');
		$('#bars').find('.hilite').removeClass('hilite');
		sections.addClass('hilite')
		connectSections(sections, tree, '#hover_canvas');
	}

	function deHilightTree(tree) {
		$('#hover_canvas').clearCanvas();
		if ( tree ) $( tree ).removeClass('hover');
		$('#bars').find('.hilite').removeClass('hilite');
	}

	function sortTrees(prop, asc) {
		treeData = treeData.sort(function(a, b) {
	        if (asc) return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
	        else return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
	    });
	}

	function resetUI() {
		$('#hover_canvas').clearCanvas();
		$('#tree_canvas').clearCanvas();
		$('#trees_grid').find('ul').empty();
		$.each(boroughs, function(index){
			$("#borough-" + index).find('span').remove();
		}); 
		updateBarCounts();
	}

	function initEvents() {
		$( window ).resize(function() {
			resizeCanvas();
			if (redrawTimer) {
				clearTimeout(redrawTimer);
			}
			redrawTimer = setTimeout(connectTrees,300);

		});
		$( "#trees_grid" ).delegate( "li", "click", function() {
		  	$( this ).toggleClass( "selected" );
		  	connectTrees(); 
		})
		.delegate( "li", "mouseenter", function() {
			if ($(this).hasClass("selected")) {
				return;
			};
		    hilightTree(this)
		})
		.delegate( "li", "mouseleave", function() {
			deHilightTree($(this));
		});
		$( "#bars" ).delegate( " .bar span ", "click", function() {
		  	$('#' + $( this ).data('tree')).toggleClass('selected');
		  	connectTrees(); 
		})
		.delegate( ".bar span ", "mouseenter", function() {
			var tree = $('#' + $( this ).data('tree'));
			if (tree.hasClass("selected")) {
				return;
			};
		    hilightTree(tree)
		})
		.delegate( ".bar span ", "mouseleave", function() {
			var tree = $('#' + $( this ).data('tree'));
			deHilightTree(tree);
		});


		$( "#reset_ui" ).on("click", function(event){
			event.preventDefault();
			$('#trees_grid .selected').removeClass('selected');
			connectTrees();
		})
	}
	_self.init = function () {
		loadBoroughData();
		initEvents();
	};
		return _self;

}(jQuery));
jQuery(document).ready(function(){
	treeViz.init(); 
	PointerEventsPolyfill.initialize({});
});

// Circle packing
var svg = d3.select("#circle-packing"),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

var color = d3.scaleLinear()
    .domain([-1, 5])
    // .range(['rgba(0, 0, 0, 0)', 'rgba(68, 87, 22, 1)'])
    .range(['rgba(0, 0, 0, 0)', '#7f7f7f'])
    .interpolate(d3.interpolateHcl);

var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

// Create JSON for trees by area
function createTreesJSON(ny, et, to, sb) {
	var all_trees = {};
	all_trees.name = 'trees';

	var areas = [
		{name: 'North York'},
		{name: 'Etobicoke York'},
		{name: 'Toronto and East York'},
		{name: 'Scarborough'}
	];
	all_trees.children = areas;

	all_trees.children[0].children = ny;
	all_trees.children[1].children = et;
	all_trees.children[2].children = to;
	all_trees.children[3].children = sb;

	drawCirclePacking(all_trees);
}

function createEmptyTreesJSON() {
	var all_trees = {};
	all_trees.name = 'trees';

	var areas = [
		{name: 'North York'},
		{name: 'Etobicoke York'},
		{name: 'Toronto and East York'},
		{name: 'Scarborough'}
	];
	all_trees.children = areas;

	all_trees.children[0].children = [{name: 'North York', size: 195064}];
	all_trees.children[1].children = [{name: 'Etobicoke York', size: 182385}];
	all_trees.children[2].children = [{name: 'Toronto and East York', size: 152424}];
	all_trees.children[3].children = [{name: 'Scarborough', size: 128299}];

	return all_trees;
}
var empty_trees = createEmptyTreesJSON();
// Draw empty trees for placeholder
drawCirclePacking(empty_trees);

// Draw circle packing chart
function drawCirclePacking(root) {
	// Remove previous elements to prevent corruption
	function removePreviousElements() {
		var all_nodes = document.querySelectorAll('.node');
		var all_labels = document.querySelectorAll('.label');
		function removeElements(el) {
			for (let i = 0; i < el.length; i++) {
				el[i].remove();
			}
		}
		removeElements(all_nodes);
		removeElements(all_labels);		
	}
	removePreviousElements();

	root = d3.hierarchy(root)
	.sum(function(d) { return d.size; })
	.sort(function(a, b) { return b.value - a.value; });

	var focus = root,
	nodes = pack(root).descendants(),
	view;

	var circle = g.selectAll("circle")
	.data(nodes)
	.enter().append("circle")
	.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
	.style("fill", function(d) { return d.children ? color(d.depth) : null; })
	.on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

	var text = g.selectAll("text")
	.data(nodes)
	.enter().append("text")
	.attr("class", "label")
	.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
	.style("display", function(d) { return d.parent === root ? "inline" : "none"; })
	// tree name
	.text(function(d) { return d.data.name; });

	var node = g.selectAll("circle,text");

	svg
	.style("background", color(-1))
	.on("click", function() { zoom(root); });

	zoomTo([root.x, root.y, root.r * 2 + margin]);

	function zoom(d) {
		var focus0 = focus; focus = d;

		var transition = d3.transition()
		.duration(d3.event.altKey ? 7500 : 750)
		.tween("zoom", function(d) {
			var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
			return function(t) { zoomTo(i(t)); };
		});

		transition.selectAll("text")
		.filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
		.style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
		.on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
		.on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
	}

	function zoomTo(v) {
		var k = diameter / v[2]; view = v;
		node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
		circle.attr("r", function(d) { return d.r * k; });
	}	

}

// Deselect All button
var btn_deselect = document.querySelector('#btn_deselect');
btn_deselect.addEventListener("click", function(){
	location.reload();
});

