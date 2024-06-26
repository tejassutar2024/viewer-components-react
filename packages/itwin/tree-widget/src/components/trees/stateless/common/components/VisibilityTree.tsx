/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { Flex, ProgressRadial, Text } from "@itwin/itwinui-react";
import { createECSchemaProvider, createECSqlQueryExecutor } from "@itwin/presentation-core-interop";
import { createLimitingECSqlQueryExecutor } from "@itwin/presentation-hierarchies";
import { LocalizationContextProvider, useSelectionHandler, useUnifiedSelectionTree } from "@itwin/presentation-hierarchies-react";
import { createCachingECClassHierarchyInspector } from "@itwin/presentation-shared";
import { TreeWidget } from "../../../../../TreeWidget";
import { useHierarchiesLocalization } from "../UseHierarchiesLocalization";
import { useHierarchyLevelFiltering } from "../UseHierarchyFiltering";
import { useHierarchyVisibility } from "../UseHierarchyVisibility";
import { useMultiCheckboxHandler } from "../UseMultiCheckboxHandler";
import { Delayed } from "./Delayed";
import { ProgressOverlay } from "./ProgressOverlay";
import { VisibilityTreeRenderer } from "./VisibilityTreeRenderer";

import type { ReactElement, ReactNode } from "react";
import type { IModelConnection } from "@itwin/core-frontend";
import type { SchemaContext } from "@itwin/ecschema-metadata";
import type { PresentationHierarchyNode, useTree } from "@itwin/presentation-hierarchies-react";

interface VisibilityTreeOwnProps {
  imodel: IModelConnection;
  getSchemaContext: (imodel: IModelConnection) => SchemaContext;
  height: number;
  width: number;
  treeName: string;
  hierarchyLevelSizeLimit?: number;
  getIcon?: (node: PresentationHierarchyNode) => ReactElement | undefined;
  getSublabel?: (node: PresentationHierarchyNode) => ReactElement | undefined;
  density?: "default" | "enlarged";
  noDataMessage?: ReactNode;
}

type UseTreeProps = Parameters<typeof useTree>[0];
type UseHierarchyVisibilityProps = Parameters<typeof useHierarchyVisibility>[0];
type IModelAccess = UseTreeProps["imodelAccess"];
type UseSelectionHandlerProps = Parameters<typeof useSelectionHandler>[0];

type VisibilityTreeProps = VisibilityTreeOwnProps &
  Pick<UseTreeProps, "getFilteredPaths" | "getHierarchyDefinition" | "onPerformanceMeasured"> &
  UseHierarchyVisibilityProps &
  Pick<Partial<UseSelectionHandlerProps>, "selectionMode">;

/** @internal */
export function VisibilityTree({ imodel, getSchemaContext, hierarchyLevelSizeLimit, ...props }: VisibilityTreeProps) {
  const [imodelAccess, setImodelAccess] = useState<IModelAccess>();
  const defaultHierarchyLevelSizeLimit = hierarchyLevelSizeLimit ?? 1000;

  useEffect(() => {
    const schemaProvider = createECSchemaProvider(getSchemaContext(imodel));
    setImodelAccess({
      ...createLimitingECSqlQueryExecutor(createECSqlQueryExecutor(imodel), defaultHierarchyLevelSizeLimit),
      ...schemaProvider,
      ...createCachingECClassHierarchyInspector({ schemaProvider }),
    });
  }, [imodel, getSchemaContext, defaultHierarchyLevelSizeLimit]);

  if (!imodelAccess) {
    return null;
  }

  return <VisibilityTreeImpl {...props} imodel={imodel} imodelAccess={imodelAccess} defaultHierarchyLevelSizeLimit={defaultHierarchyLevelSizeLimit} />;
}

function VisibilityTreeImpl({
  height,
  width,
  imodel,
  imodelAccess,
  getHierarchyDefinition,
  getFilteredPaths,
  visibilityHandlerFactory,
  defaultHierarchyLevelSizeLimit,
  noDataMessage,
  treeName,
  getIcon,
  getSublabel,
  density,
  selectionMode,
  onPerformanceMeasured,
}: Omit<VisibilityTreeProps, "getSchemaContext" | "hierarchyLevelSizeLimit"> & { imodelAccess: IModelAccess; defaultHierarchyLevelSizeLimit: number }) {
  const localizedStrings = useHierarchiesLocalization();
  const {
    rootNodes,
    isLoading,
    reloadTree: _reloadTree,
    selectNodes,
    setFormatter: _setFormatter,
    ...treeProps
  } = useUnifiedSelectionTree({
    imodelAccess,
    getHierarchyDefinition,
    getFilteredPaths,
    imodelKey: imodel.key,
    sourceName: treeName,
    onPerformanceMeasured,
    localizedStrings,
  });
  const { onNodeClick, onNodeKeyDown } = useSelectionHandler({ rootNodes, selectNodes, selectionMode: selectionMode ?? "single" });
  const { getCheckboxStatus, onCheckboxClicked: onClick } = useHierarchyVisibility({ visibilityHandlerFactory });
  const { onCheckboxClicked } = useMultiCheckboxHandler({ rootNodes, isNodeSelected: treeProps.isNodeSelected, onClick });
  const { filteringDialog, onFilterClick } = useHierarchyLevelFiltering({
    imodel,
    getHierarchyLevelDetails: treeProps.getHierarchyLevelDetails,
    defaultHierarchyLevelSizeLimit,
  });

  if (rootNodes === undefined) {
    return (
      <Flex alignItems="center" justifyContent="center" flexDirection="column" style={{ width, height }}>
        <Delayed show={true}>
          <ProgressRadial size="large" />
        </Delayed>
      </Flex>
    );
  }

  if (rootNodes.length === 0 && !isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" flexDirection="column" style={{ width, height }}>
        {noDataMessage ? noDataMessage : <Text>{TreeWidget.translate("stateless.dataIsNotAvailable")}</Text>}
      </Flex>
    );
  }

  return (
    <div style={{ position: "relative", height, overflow: "hidden" }}>
      <div style={{ overflow: "auto", height: "100%" }}>
        <LocalizationContextProvider localizedStrings={localizedStrings}>
          <VisibilityTreeRenderer
            rootNodes={rootNodes}
            {...treeProps}
            onNodeClick={onNodeClick}
            onNodeKeyDown={onNodeKeyDown}
            getCheckboxStatus={getCheckboxStatus}
            onCheckboxClicked={onCheckboxClicked}
            onFilterClick={onFilterClick}
            getIcon={getIcon}
            getSublabel={getSublabel}
            size={density === "enlarged" ? "default" : "small"}
          />
        </LocalizationContextProvider>
        {filteringDialog}
      </div>
      <Delayed show={isLoading}>
        <ProgressOverlay />
      </Delayed>
    </div>
  );
}
