"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import * as d3 from "d3";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.IVisualHost;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";
import { HillChartViewModel, DataPoint, DataPointSettings, HillSettings, HillChartSettings } from "./dataInterfaces";

export class HillChart implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;

    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private element: HTMLElement;

    private svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
    private locale: string;

    static PointConfig = {
        solidOpacity: 1,
        transparentOpacity: 0.5,
    };


    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);

        this.host = options.host;
        this.element = options.element;
        this.selectionManager = options.host.createSelectionManager();
        this.locale = options.host.locale;

        this.svg = d3.select(options.element)
            .append('svg')
            .classed('HillChart', true);

        this.selectionManager.registerOnSelectCallback(() => {
            this.syncSelectionState(<ISelectionId[]>this.selectionManager.getSelectionIds());
        });
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);

        this.settings = HillChart.parseSettings(options && options.dataViews && options.dataViews[0]);
        let viewModel: HillChartViewModel = visualTransform(options, this.host, this.settings);

        let width = options.viewport.width;
        let height = options.viewport.height;

        let leftAxisLabel: string = "Figuring things out";
        let rightAxisLabel: string = "Making it happen";

        if (viewModel.settings.hill.axisLabelUpper) {
            leftAxisLabel = leftAxisLabel.toUpperCase();
            rightAxisLabel = rightAxisLabel.toUpperCase();
        }

        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width - 10]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height - 40, 10])

        // Hill line
        const hillData = d3.range(0, 100, 0.1).map(i => ({
            x: i,
            y: translateXtoY(i)
        }))

        const hillLine = d3.line<any>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));

        this.svg.selectAll("*").remove();

        this.svg
            .attr("width", width)
            .attr("height", height);

        // Hill line
        this.svg
            .append('path')
            .attr('class', 'line')
            .datum(hillData)
            .attr("fill", "none")
            .attr("stroke", viewModel.settings.hill.hillLineColour || "#cccccc")
            .attr("stroke-width", 2)
            .attr('d', hillLine);


        // Bottom axis line
        /*
        this.svg
            .append('line')
            .attr('class', 'middle')
            .attr('x1', xScale(0))
            .attr('y1', yScale(-5))
            .attr('x2', xScale(100))
            .attr('y2', yScale(-5))
            .attr('stroke', "#dddddd")
            .attr("stroke-width", 1);
        */

        // Axis labels
        this.svg
            .append('text')
            .attr('class', 'text')
            .attr("style", "font-family: Tahoma; font-size: " + viewModel.settings.hill.fontSize || 14 + "px;")
            .attr("fill", "#999999")
            .text(leftAxisLabel)
            .attr('x', xScale(15))
            .attr('y', height - 5);

        this.svg
            .append('text')
            .attr('class', 'text')
            .attr("style", "font-family: Tahoma; font-size: " + viewModel.settings.hill.fontSize || 14 + "px;")
            .attr("fill", "#999999")
            .text(rightAxisLabel)
            .attr('x', xScale(70))
            .attr('y', height - 5);

        // Middle line
        if (viewModel.settings.hill.enableMiddleLine) {
            this.svg
                .append('line')
                .attr('class', 'middle')
                .attr('x1', xScale(50))
                .attr('y1', yScale(0))
                .attr('x2', xScale(50))
                .attr('y2', yScale(100))
                .attr('stroke', "#dddddd")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", 10);
        }

        // Data points
        const group = this.svg
            .selectAll('.group')
            .data(viewModel.dataPoints)
            .enter()
            .append('g')
            .attr('class', 'group')
            .attr('transform', d => {
                return `translate(${xScale(d.progress)}, ${yScale(translateXtoY(d.progress))})`
            });

        let selectionManager = this.selectionManager;

        group
            .append('circle')
            .attr('fill', d => d.colour || viewModel.settings.dataPoint.defaultColour || "#00000")
            .attr('stroke', "#ffffff")
            .attr("stroke-width", 2)
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', d => d.size || viewModel.settings.dataPoint.defaultSize || 10)
            .attr('fill-opacity', HillChart.PointConfig.solidOpacity);

    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

    private syncSelectionState(
        //selection: Selection<DataPoint>,
        selectionIds: ISelectionId[]
    ): void {

    }
}

/**
 * Simple function to convert the input value into a clean 0-100 value
 * @param value
 */
function convertValue(value: string): number {
    let item = parseFloat(value);
    if (item > 100)
        return 100;
    if (item == 0)
        return 0;
    if (item < 1)
        return item * 100;
    return item;
}

/**
 * Converts the x (progress) position to the y (height)
 * @param x progress
 */
function translateXtoY(x: number): number {
    return (50 * Math.sin((Math.PI / 50) * x - (1 / 2) * Math.PI) + 50);
}

/**
* Function that converts queried data into a view model that will be used by the visual
*
* @function
* @param {VisualUpdateOptions} options - Contains references to the size of the container
*                                        and the dataView which contains all the data
*                                        the visual had queried.
* @param {IVisualHost} host            - Contains references to the host which contains services
*/
function visualTransform(options: VisualUpdateOptions, host: IVisualHost, settings: VisualSettings): HillChartViewModel {

    let dataViews = options.dataViews;

    // Hill Settings
    let hillSettings: HillSettings = {
        hillLineColour: settings.hillSettings.hillColor,
        fontSize: settings.hillSettings.fontSize.toString(),
        enableMiddleLine: settings.hillSettings.enableMiddleLine,
        axisLabelUpper: settings.hillSettings.axisLabelUpper
    }
    // Default Data Point Settings
    let dataPointSettings: DataPointSettings = {
        defaultColour: settings.dataPointSettings.defaultColour,
        defaultSize: settings.dataPointSettings.defaultSize
    }

    let viewModel: HillChartViewModel = {
        dataPoints: [],
        settings: {
            hill: hillSettings,
            dataPoint: dataPointSettings
        }
    };

    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].table
    ) {
        return viewModel;
    }
    let tbl = dataViews[0].table;

    /*
        let selectionId = host.createSelectionIdBuilder()
                            .withTable()
                            .createSelectionId();
    */
    var columnProgress: number;
    var columnProject: number;

    tbl.columns.forEach(
        (col) => {
            if (col.roles.progress)
                columnProgress = col.index;
            if (col.roles.project)
                columnProject = col.index;
        }
    );

    var rowCnt = 1;
    tbl.rows.forEach(
        (row) => {
            
            console.log("Row count: ", rowCnt)

            let progressValue: number = convertValue(row[columnProgress].toString());
            let projectValue: string = row[columnProject].toString();
            const selId = this.host.createSelectionIdBuilder()
                            .withTable(tbl, rowCnt)
                            .createSelectionId();

            console.log("Test");

            viewModel.dataPoints.push(
                {
                    progress: progressValue,
                    project: projectValue,
                    selectionId: selId
                }
            );

            rowCnt += 1;

            
        }
    );
    //viewModel.settings

    return viewModel;
}