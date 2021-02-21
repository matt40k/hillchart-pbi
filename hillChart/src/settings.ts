"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
  public hillSettings: hillSettings = new hillSettings();
  public dataPointSettings: dataPointSettings = new dataPointSettings();
}

export class hillSettings {
  public showAllDataPoints: boolean = true;
  public hillColor: string = "#cccccc";
  public fontSize: number = 14;
  public enableMiddleLine: boolean = true;
  public axisLabelUpper: boolean = false;
}

export class dataPointSettings {
  public defaultSize: number = 10;
  public defaultColour: string = "#00000";
}