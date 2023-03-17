/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as React from "react";
// import { AbstractWidgetProps, AbstractZoneLocation, StagePanelLocation, StagePanelSection, StageUsage, UiItemsProvider } from "@itwin/appui-abstract";
import { StagePanelLocation, StagePanelSection, StageUsage, UiItemsProvider, Widget } from "@itwin/appui-react";
import { MapLayersWidget } from "./widget/MapLayersWidget";
import { MapLayerOptions } from "./Interfaces";
// import { MapLayersUI } from "../mapLayers";

export class MapLayersUiItemsProvider implements UiItemsProvider {
  public readonly id = "MapLayersUiItemsProvider";
  private _mapLayerOptions?: MapLayerOptions;

  public constructor(mapLayerOptions?: MapLayerOptions) {
    this._mapLayerOptions = mapLayerOptions ?? {
      hideExternalMapLayers: false,
      mapTypeOptions: { supportTileUrl: false, supportWmsAuthentication: true },
      fetchPublicMapLayerSources: false,
    };
  }

  public provideWidgets(_stageId: string, stageUsage: string, location: StagePanelLocation, section?: StagePanelSection) {
    const widgets: Widget[] = [];
    if ((undefined === section && stageUsage === StageUsage.General && location === StagePanelLocation.Right) ||
      (stageUsage === StageUsage.General && location === StagePanelLocation.Right && section === StagePanelSection.Start)) {
      widgets.push({
        id: "map-layers:mapLayersWidget",
        // label: MapLayersUI.localization.getLocalizedString("mapLayers:Widget.Label"),
        icon: "icon-map",
        content: <MapLayersWidget mapLayerOptions={this._mapLayerOptions} />, // eslint-disable-line react/display-name
      });
    }
    return widgets;
  }

  // public provideWidgets(_stageId: string, stageUsage: string, location: StagePanelLocation, section: StagePanelSection | undefined, zoneLocation?: AbstractZoneLocation): ReadonlyArray<AbstractWidgetProps> {
  //   const widgets: AbstractWidgetProps[] = [];

  //   if ((undefined === section && stageUsage === StageUsage.General && zoneLocation === AbstractZoneLocation.CenterRight) ||
  //     (stageUsage === StageUsage.General && location === StagePanelLocation.Right && section === StagePanelSection.Start)) {
  //     widgets.push({
  //       id: "map-layers:mapLayersWidget",
  //       // label: MapLayersUI.localization.getLocalizedString("mapLayers:Widget.Label"),
  //       icon: "icon-map",
  //       getWidgetContent: () => <MapLayersWidget mapLayerOptions={this._mapLayerOptions} />, // eslint-disable-line react/display-name
  //     });
  //   }

  //   return widgets;
  // }
}