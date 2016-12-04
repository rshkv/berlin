class Heatmap {

	constructor(selection, berlin) {
		this.selection = selection;
		this.extents = berlin.extents;
		this.color = d3.scaleSequential(d3.interpolateOrRd);
	}

	pathGenerator(svg, data) {
		const width = svg.attr("width");
		const height = svg.attr("height");

		const projection = d3.geoMercator()
			.fitExtent([
				[0, 0],
				[width, height]
			], data);
		return d3.geoPath(projection);
	}

	render() {
		this.selection.each((data, i, selection) => {
			const svg = d3.select(selection[0]);
			const path = this.pathGenerator(svg, data);

			svg.selectAll("path")
				.data(data.features)
				.enter()
				.append("path")
				.style("fill", this.accessor)
				.attr("d", path)
				.on("click", (d) => {
					console.log(d.properties);
				})
				.on("mouseover", function(d) {
					d3.select(this)
						.style("stroke", "white")
						.style("stroke-width", 3);

				})
				.on("mouseleave", function(d) {
					d3.select(this)
						.style("stroke", "none");
				});
		});
	}

	update() {
		this.selection.each((data, i, selection) => {
			const svg = d3.select(selection[i]);
			const path = this.pathGenerator(svg, data);

			svg.selectAll("path")
				.data(data.features)
				.style("fill", this.accessor)
				.attr("d", path);
		});
	}

	setProperty(path, normalize) {
		let extent = _.get(this.extents, path);
		const range = extent[1] - extent[0];
		const widen = 0.1;
		console.log(extent);
		extent = [extent[0] - widen * range, extent[1] + widen * range];
		console.log(extent);
		this.color
			.domain(normalize ? extent: [0, 1]);
		this.accessor = d => {
			const value = _.get(d.properties, path);
			return (value) ? this.color(value) : "white";
		};
		return this;
	}
}
