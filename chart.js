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
				.style("fill", this.colorAccessor.bind(this))
				.attr("d", path)
				.on("click", (d) => {
					console.log(d.properties);
				})
				.on("mouseover", this.handleMouseOver.bind(this))
				.on("mouseleave", this.handleMouseLeave.bind(this));
		});
	}

	update() {
		this.selection.each((data, i, selection) => {
			const svg = d3.select(selection[i]);
			const path = this.pathGenerator(svg, data);

			svg.selectAll("path")
				.data(data.features)
				.style("fill", this.colorAccessor.bind(this))
				.attr("d", path);
		});
	}

	colorAccessor(d) {
		const value = _.get(d.properties, this.accessor);
		return (value) ? this.color(value) : "white";
	}

	setProperty(path, normalize) {
		this.accessor = path.split(".");
		this.normalize = normalize;

		let extent = _.get(this.extents, path);
		const range = extent[1] - extent[0];
		const widen = 0.1;
		extent = [extent[0] - widen * range, extent[1] + widen * range];
		this.color
			.domain(normalize ? extent : [0, 1]);

		return this;
	}

	setNotify(selector) {
		this.notify = selector;
		return this;
	}

	handleMouseOver(d, i, selection) {
		d3.select(selection[i])
			.style("stroke", "white")
			.style("stroke-width", 3);

		const properties = _.reduce(
			_.get(d.properties, this.accessor[0]),
			(result, v, k) => {
				result[k] = (this.normalize) ? _.round(v, 2) : `${_.round(v * 100, 1)}%`;
				return result;
			}, {});
		this.notify.trigger("mouseover", [d.properties.Ortsteil, properties]);
	}

	handleMouseLeave(d, i, selection) {
		d3.select(selection[i])
			.style("stroke", "none");

		this.notify.trigger("mouseleave");
	}
}
