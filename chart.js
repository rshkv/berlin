class Heatmap {

	constructor(selection) {
		this.selection = selection;

		this.color = d3.scaleSequential(d3.interpolateOrRd);
		this.accessors = {
			Frauen: "Frauen",
			Männer: "Männer"
		}
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
				.style("fill", this.fillAccessor)
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
				.style("fill", this.fillAccessor)
				.attr("d", path);
		});
	}

	setProperty(property) {
		const path = property;
		this.fillAccessor = d => {
			//console.log(d.properties);
			//console.log(path);
			return this.color(parseFloat(_.get(d.properties, path)));
		};
		return this;
	}
}
