/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import type { Point3d} from "@itwin/core-geometry";
import { AxisOrder, Matrix3d, Vector3d } from "@itwin/core-geometry";
import type {
  DecorateContext,
  ToolAssistanceInstruction,
  ToolAssistanceSection,
} from "@itwin/core-frontend";
import {
  AccuDrawHintBuilder,
  BeButtonEvent,
  EventHandled,
  IModelApp,
  ToolAssistance,
  ToolAssistanceImage,
  ToolAssistanceInputMethod,
} from "@itwin/core-frontend";
import type { Feature } from "../api/FeatureTracking";
import { MeasureToolsFeatures } from "../api/FeatureTracking";
import { MeasurementToolBase } from "../api/MeasurementTool";
import { MeasurementViewTarget } from "../api/MeasurementViewTarget";
import type { AreaMeasurement } from "../measurements/AreaMeasurement";
import { MeasureAreaToolModel } from "../toolmodels/MeasureAreaToolModel";
import { MeasureTools } from "../MeasureTools";
import { SheetMeasurementsHelper } from "../api/SheetMeasurementHelper";

export class MeasureAreaTool extends MeasurementToolBase<
AreaMeasurement,
MeasureAreaToolModel
> {
  public static override toolId = "MeasureTools.MeasureArea";
  public static override iconSpec = "icon-measure-2d";
  private _enableSheetMeasurements;
  private _currentMousePoint?: Point3d;

  public static override get flyover() {
    return MeasureTools.localization.getLocalizedString(
      "MeasureTools:tools.MeasureArea.flyover"
    );
  }
  public static override get description(): string {
    return MeasureTools.localization.getLocalizedString(
      "MeasureTools:tools.MeasureArea.description",
    );
  }
  public static override get keyin(): string {
    return MeasureTools.localization.getLocalizedString(
      "MeasureTools:tools.MeasureArea.keyin",
    );
  }

  protected override get feature(): Feature | undefined {
    return MeasureToolsFeatures.Tools_MeasureArea;
  }

  constructor(enableSheetMeasurements = false) {
    super();
    this._enableSheetMeasurements = enableSheetMeasurements;
  }

  public async onRestartTool(): Promise<void> {
    const tool = new MeasureAreaTool(this._enableSheetMeasurements);
    if (await tool.run()) return;

    return this.exitTool();
  }

  private resetSheetData(): void {
    this.toolModel.firstPointDrawingId = undefined;
    this.toolModel.drawingExtents = undefined;
    this.toolModel.drawingExtents = undefined;
    this.toolModel.setWorldScale(undefined);
  }

  public override async onReinitialize(): Promise<void> {
    await super.onReinitialize();
    this.resetSheetData();
    AccuDrawHintBuilder.deactivate();
  }

  public override async onUndoPreviousStep(): Promise<boolean> {
    if (this.toolModel.popMeasurementPoint()) {
      const ev = new BeButtonEvent();
      this.getCurrentButtonEvent(ev);

      // Update the dynamic polygon
      await this.onMouseMotion(ev);

      this._sendHintsToAccuDraw(ev);
      this.updateToolAssistance();
      return true;
    }

    return super.onUndoPreviousStep();
  }

  public override async onDataButtonDown(
    ev: BeButtonEvent
  ): Promise<EventHandled> {
    if (!ev.viewport) return EventHandled.No;

    const viewType = MeasurementViewTarget.classifyViewport(ev.viewport);

    let first = false;

    if (
      MeasureAreaToolModel.State.SetMeasurementViewport ===
      this.toolModel.currentState
    ) {
      this.toolModel.setMeasurementViewport(viewType);
      first = true;
    }

    this.toolModel.addPoint(viewType, ev.point, false);
    await this.sheetMeasurementsDataButtonDown(ev, first);
    if (undefined === this.toolModel.dynamicMeasurement) {
      await this.onReinitialize();
    } else {
      this._sendHintsToAccuDraw(ev);
      this.updateToolAssistance();
    }

    ev.viewport.invalidateDecorations();
    return EventHandled.Yes;
  }

  private async sheetMeasurementsDataButtonDown(ev: BeButtonEvent, initial: boolean) {
    if (!ev.viewport) return;

    if (this._enableSheetMeasurements) {
      if (this.toolModel.firstPointDrawingId === undefined && ev.viewport.view.id !== undefined && initial) {
        const drawingInfo = await SheetMeasurementsHelper.getDrawingId(this.iModel, ev.viewport.view.id, ev.point);
        this.toolModel.firstPointDrawingId = drawingInfo?.id;
        if (this.toolModel.firstPointDrawingId) {
          this.toolModel.setWorldScale(drawingInfo?.scale);
          this.toolModel.drawingOrigin = drawingInfo?.origin;
          this.toolModel.drawingExtents = drawingInfo?.extents;
          this.toolModel.sheetViewId = ev.viewport.view.id;
        }
      } else {
        if (this.toolModel.firstPointDrawingId !== undefined) {
          if ((await SheetMeasurementsHelper.getDrawingId(this.iModel, ev.viewport.view.id, ev.point))?.id !== this.toolModel.firstPointDrawingId) {
            this.toolModel.drawingOrigin = undefined;
            this.toolModel.drawingExtents = undefined;
            this.toolModel.setWorldScale(undefined);
          }
        }
      }
    }
  }

  public override isValidLocation(ev: BeButtonEvent, _isButtonEvent: boolean): boolean {
    if (!this._enableSheetMeasurements || this.toolModel.firstPointDrawingId === undefined || this.toolModel.drawingOrigin === undefined || this.toolModel.drawingExtents === undefined)
      return true;

    return SheetMeasurementsHelper.checkIfInDrawing(ev.point, this.toolModel.drawingOrigin, this.toolModel.drawingExtents);
  }

  private _sendHintsToAccuDraw(ev: BeButtonEvent): void {
    const dynamicMeasurement = this.toolModel.dynamicMeasurement;
    if (undefined === ev.viewport || undefined === dynamicMeasurement) return;

    const points = dynamicMeasurement.polygonPoints;
    if (0 === points.length) return;

    const hints = new AccuDrawHintBuilder();
    hints.setOrigin(points[points.length - 1]);

    if (1 === points.length) {
      hints.setModeRectangular();
    } else {
      // Adjust to keep orientation defined by the last 2 points and the surface normal (if any).
      const snapDetail = IModelApp.accuSnap.getCurrSnapDetail();
      if (undefined !== snapDetail && undefined !== snapDetail.normal) {
        const normal = Vector3d.createZero();
        const xVector = Vector3d.createStartEnd(
          points[points.length - 2],
          points[points.length - 1]
        );
        const zVector = ev.viewport.view.getZVector();
        if (zVector.dotProduct(snapDetail.normal) < 0.0)
          normal.setFrom(snapDetail.normal);
        else snapDetail.normal.negate(normal);

        const mat = Matrix3d.createRigidFromColumns(
          xVector,
          normal,
          AxisOrder.XZY
        );
        if (undefined !== mat) hints.setRotation(mat.inverse()!);
      }
    }
    hints.sendHints(false);
    IModelApp.toolAdmin.setCursor(IModelApp.viewManager.crossHairCursor);
  }

  public override async onResetButtonDown(
    ev: BeButtonEvent
  ): Promise<EventHandled> {
    // Attempt to close polygon
    if (this.toolModel.tryCommitMeasurement()) {
      await this.onReinitialize();
      return EventHandled.Yes;
    }

    return super.onResetButtonDown(ev);
  }

  public override async onMouseMotion(ev: BeButtonEvent): Promise<void> {
    if (!ev.viewport) return;

    const viewType = MeasurementViewTarget.classifyViewport(ev.viewport);
    this._currentMousePoint = ev.point;
    if (this.toolModel.addPoint(viewType, ev.point, true))
      ev.viewport.invalidateDecorations();
  }

  protected createToolModel(): MeasureAreaToolModel {
    return new MeasureAreaToolModel();
  }

  public override decorate(context: DecorateContext): void {
    super.decorate(context);

    if (this._enableSheetMeasurements && this.toolModel.drawingOrigin !== undefined && this.toolModel.drawingExtents !== undefined) {
      context.addDecorationFromBuilder(SheetMeasurementsHelper.getDrawingContourGraphic(context, this.toolModel.drawingOrigin, this.toolModel.drawingExtents));
    }
  }

  protected override updateToolAssistance(): void {
    const hasPoints = undefined !== this.toolModel.dynamicMeasurement;
    const hasEnoughPoints = hasPoints && this.toolModel.hasEnoughPoints;

    let promptMainInstruction: string;
    if (hasEnoughPoints)
      promptMainInstruction = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.MeasureArea.mainInstructionClose"
      );
    else
      promptMainInstruction = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.MeasureArea.mainInstruction"
      );

    const promptClickTap = MeasureTools.localization.getLocalizedString(
      "MeasureTools:tools.GenericPrompts.acceptPoint"
    );

    let promptRightClick: string;
    if (hasEnoughPoints)
      promptRightClick = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.MeasureArea.rightClickCloseShape"
      );
    else if (hasPoints)
      promptRightClick = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.MeasureArea.rightClickClearShape"
      );
    else
      promptRightClick = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.GenericPrompts.restart"
      );

    const mainInstruction = ToolAssistance.createInstruction(
      this.iconSpec,
      promptMainInstruction
    );
    const mouseInstructions: ToolAssistanceInstruction[] = [];
    const touchInstructions: ToolAssistanceInstruction[] = [];

    if (!ToolAssistance.createTouchCursorInstructions(touchInstructions)) {
      touchInstructions.push(
        ToolAssistance.createInstruction(
          ToolAssistanceImage.OneTouchTap,
          promptClickTap,
          false,
          ToolAssistanceInputMethod.Touch
        )
      );
      if (hasEnoughPoints) {
        const tmp = MeasureTools.localization.getLocalizedString(
          "MeasureTools:tools.MeasureArea.oneTouchTapClose"
        );
        touchInstructions.push(
          ToolAssistance.createInstruction(
            ToolAssistanceImage.OneTouchTap,
            tmp,
            false,
            ToolAssistanceInputMethod.Touch
          )
        );
      }
    }
    mouseInstructions.push(
      ToolAssistance.createInstruction(
        ToolAssistanceImage.LeftClick,
        promptClickTap,
        false,
        ToolAssistanceInputMethod.Mouse
      )
    );
    if (hasEnoughPoints) {
      const tmp = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.MeasureArea.leftClickClose"
      );
      mouseInstructions.push(
        ToolAssistance.createInstruction(
          ToolAssistanceImage.LeftClick,
          tmp,
          false,
          ToolAssistanceInputMethod.Mouse
        )
      );
    }
    mouseInstructions.push(
      ToolAssistance.createInstruction(
        ToolAssistanceImage.RightClick,
        promptRightClick,
        false,
        ToolAssistanceInputMethod.Mouse
      )
    );

    if (undefined !== this.toolModel.dynamicMeasurement) {
      const undoPointText = MeasureTools.localization.getLocalizedString(
        "MeasureTools:tools.MeasureArea.undoLastPoint"
      );
      mouseInstructions.push(this.createMouseUndoInstruction(undoPointText));
    } else {
      if (this.toolModel.canUndo)
        mouseInstructions.push(this.createMouseUndoInstruction());
      if (this.toolModel.canRedo)
        mouseInstructions.push(this.createMouseRedoInstruction());
    }

    const sections: ToolAssistanceSection[] = [
      ToolAssistance.createSection(
        mouseInstructions,
        ToolAssistance.inputsLabel
      ),
      ToolAssistance.createSection(
        touchInstructions,
        ToolAssistance.inputsLabel
      ),
    ];
    const instructions = ToolAssistance.createInstructions(
      mainInstruction,
      sections
    );
    IModelApp.notifications.setToolAssistance(instructions);
  }
}
