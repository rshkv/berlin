const windowExtent = function() {
	const width = parseInt(d3.select(".chart").style("width"));
	const height = parseInt(d3.select(".chart").style("height"));
	return [width, height];
}

const svg = d3.select(".chart")
	.append("svg")


d3.json("data/berlin.json", (berlin) => {
	const [width, height] = windowExtent();
	const hoverSelection = $(".hoverSelection");

	svg
		.attr("width", width)
		.attr("height", height)
		.datum(berlin);

	const heatmap = new Heatmap(svg, berlin);

	heatmap
		.setNotify(hoverSelection)
		.setProperty("Geschlecht.Frauen")
		.render();

	$(".legend input").click(function(event) {
		const property = $(this).attr('id');
		const normalize = $(this).attr('normalize');

		heatmap
			.setProperty(property, normalize)
			.update();
	});

	$(window).resize(() => {
		const [width, height] = windowExtent();
		svg
			.attr("width", width)
			.attr("height", height)
		heatmap.update()
	});

	hoverSelection.on("mouseover", function(e, name, props) {
		const div = d3.select(this);
		div.select(".name")
			.text(name);

		div.select(".properties").selectAll("div")
			.data(_.sortBy(_.toPairs(props), d => d[0]))
			.enter()
			.append("span")
			.attr("class", "col-xl-2")
			.text(d => `${d[0]}: ${d[1]}`);
	});

	hoverSelection.on("mouseleave", () => {
		hoverSelection.find(".name").empty();
		hoverSelection.find(".properties").empty();
	});
});
