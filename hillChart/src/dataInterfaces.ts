"use strict";

import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

export interface HillChartViewModel {
    dataPoints: DataPoint[];
    settings: HillChartSettings;
}

export interface DataPoint {
    progress: number;
    project: string;
    colour?: string;
    size?: string;
    selectionId?: ISelectionId;
    tooltipInfo?: VisualTooltipDataItem[];
}

export interface DataPointSettings {
    defaultSize?: number;
    defaultColour?: string;
}

export interface HillSettings {
    hillLineColour: string;
    fontSize: string;
    enableMiddleLine: boolean;
    axisLabelUpper: boolean;
}

export interface HillChartSettings {
    hill: HillSettings;
    dataPoint: DataPointSettings;
}

export interface ISelectionIdBuilder {
    withTable(table: DataViewTable, rowIndex: number): this;
    createSelectionId(): ISelectionId;
}