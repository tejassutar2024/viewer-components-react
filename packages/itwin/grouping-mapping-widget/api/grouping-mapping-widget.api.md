## API Report File for "@itwin/grouping-mapping-widget"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="react" />

import type { AccessToken } from '@itwin/core-bentley';
import { Alert } from '@itwin/itwinui-react';
import { Context } from 'react';
import { Dispatch } from 'react';
import { ExtractionStatus } from '@itwin/insights-client';
import type { Group } from '@itwin/insights-client';
import type { GroupMinimal } from '@itwin/insights-client';
import type { IExtractionClient } from '@itwin/insights-client';
import type { IGroupsClient } from '@itwin/insights-client';
import type { IMappingsClient } from '@itwin/insights-client';
import type { IModelConnection } from '@itwin/core-frontend';
import type { IPropertiesClient } from '@itwin/insights-client';
import type { Mapping } from '@itwin/insights-client';
import type { Property } from '@itwin/insights-client';
import { QueryClient } from '@tanstack/react-query';
import * as React_2 from 'react';
import { default as React_3 } from 'react';
import type { ReactElement } from 'react';
import { SetStateAction } from 'react';
import { StagePanelLocation } from '@itwin/appui-react';
import { StagePanelSection } from '@itwin/appui-react';
import type { UiItemsProvider } from '@itwin/appui-react';
import { UseMutateAsyncFunction } from '@tanstack/react-query';
import type { Widget } from '@itwin/appui-react';

// @public
export const CalculatedPropertyAction: ({ mappingId, group, calculatedProperty, onSaveSuccess, onClickCancel, }: CalculatedPropertyActionProps) => JSX.Element;

// @public
export interface CalculatedPropertyActionProps {
    // (undocumented)
    calculatedProperty?: Property;
    // (undocumented)
    group: Group;
    // (undocumented)
    mappingId: string;
    // (undocumented)
    onClickCancel?: () => void;
    // (undocumented)
    onSaveSuccess: () => void;
}

// @public
export const CalculatedPropertyActionWithVisuals: ({ mappingId, group, calculatedProperty, onSaveSuccess, onClickCancel, }: CalculatedPropertyActionWithVisualsProps) => JSX.Element;

// @public
export interface CalculatedPropertyActionWithVisualsProps {
    // (undocumented)
    calculatedProperty?: Property;
    // (undocumented)
    group: GroupMinimal;
    // (undocumented)
    mappingId: string;
    // (undocumented)
    onClickCancel?: () => void;
    // (undocumented)
    onSaveSuccess: () => void;
}

// @public (undocumented)
export type ClientPrefix = "" | "dev" | "qa" | undefined;

// @public
export interface ContextCustomUI extends IGroupingMappingCustomUI {
    onClick?: (group: GroupMinimal, mapping: Mapping, iModelId: string) => void;
    type: GroupingMappingCustomUIType.Context;
    uiComponent?: React.ComponentType<ContextCustomUIProps>;
}

// @public
export interface ContextCustomUIProps {
    groupId: string;
    iModelId: string;
    mappingId: string;
}

// @internal (undocumented)
export const createDefaultGroupsClient: (prefix?: ClientPrefix) => IGroupsClient;

// @internal (undocumented)
export const createDefaultMappingClient: (prefix?: ClientPrefix) => IMappingsClient;

// @internal (undocumented)
export const createDefaultPropertiesClient: (prefix?: ClientPrefix) => IPropertiesClient;

// @internal (undocumented)
export const createGroupsClient: (clientProp: IGroupsClient | ClientPrefix) => IGroupsClient;

// @internal (undocumented)
export const createMappingClient: (clientProp: IMappingsClient | ClientPrefix) => IMappingsClient;

// @internal (undocumented)
export const createPropertiesClient: (clientProp: IPropertiesClient | ClientPrefix) => IPropertiesClient;

// @public
export const CustomCalculationAction: ({ mappingId, groupId, customCalculation, onSaveSuccess, onClickCancel, }: CustomCalculationActionProps) => JSX.Element;

// @public
export interface CustomCalculationActionProps {
    // (undocumented)
    customCalculation?: Property;
    // (undocumented)
    groupId: string;
    // (undocumented)
    mappingId: string;
    // (undocumented)
    onClickCancel?: () => void;
    // (undocumented)
    onSaveSuccess: () => void;
}

// @public (undocumented)
export type DataType = "Double" | "String" | "Boolean" | "Integer";

// @public (undocumented)
export type GetAccessTokenFn = () => Promise<AccessToken>;

// @public
export const GroupAction: (props: GroupActionProps) => JSX.Element;

// @public
export interface GroupActionProps {
    // (undocumented)
    displayStrings?: Partial<typeof defaultDisplayStrings_2>;
    // (undocumented)
    group?: GroupMinimal;
    // (undocumented)
    mappingId: string;
    // (undocumented)
    onClickCancel?: () => void;
    // (undocumented)
    onSaveSuccess: () => void;
    // (undocumented)
    queryGenerationType: string;
    // (undocumented)
    shouldVisualize: boolean;
}

// @public
export interface GroupingCustomUI extends IGroupingMappingCustomUI {
    type: GroupingMappingCustomUIType.Grouping;
    uiComponent: (props: GroupingCustomUIProps) => JSX.Element;
}

// @public
export interface GroupingCustomUIProps {
    initialEditModeQuery?: string;
    isUpdating?: boolean;
    resetView?: () => Promise<void>;
    updateQuery: (query: string) => void;
}

// @public (undocumented)
export interface GroupingMappingApiConfig {
    // (undocumented)
    getAccessToken: GetAccessTokenFn;
    // (undocumented)
    iModelConnection?: IModelConnection;
    // (undocumented)
    iModelId: string;
    // (undocumented)
    prefix?: ClientPrefix;
}

// @public (undocumented)
export const GroupingMappingApiConfigContext: React_2.Context<GroupingMappingApiConfig>;

// @public
export const GroupingMappingContext: (props: GroupingMappingContextProps) => JSX.Element;

// @public
export interface GroupingMappingContextProps {
    // (undocumented)
    children?: React_3.ReactNode;
    customUIs?: GroupingMappingCustomUI[];
    extractionClient?: IExtractionClient;
    getAccessToken?: GetAccessTokenFn;
    groupsClient?: IGroupsClient;
    iModelConnection?: IModelConnection;
    iModelId: string;
    mappingsClient?: IMappingsClient;
    prefix?: ClientPrefix;
    propertiesClient?: IPropertiesClient;
    queryClient?: QueryClient;
}

// @public (undocumented)
export type GroupingMappingCustomUI = GroupingCustomUI | ContextCustomUI;

// @public (undocumented)
export enum GroupingMappingCustomUIType {
    // (undocumented)
    Context = 1,
    // (undocumented)
    Grouping = 0
}

// @public
export class GroupingMappingProvider implements UiItemsProvider {
    constructor(_props?: GroupingMappingProps);
    // (undocumented)
    readonly id = "GroupingMappingProvider";
    // (undocumented)
    provideWidgets(_stageId: string, stageUsage: string, location: StagePanelLocation, section?: StagePanelSection): ReadonlyArray<Widget>;
}

// @public
export const GroupPropertyAction: ({ mappingId, group, groupProperty, onSaveSuccess, onClickCancel, }: GroupPropertyActionProps) => JSX.Element;

// @public
export interface GroupPropertyActionProps {
    // (undocumented)
    group: GroupMinimal;
    // (undocumented)
    groupProperty?: Property;
    // (undocumented)
    mappingId: string;
    // (undocumented)
    onClickCancel?: () => void;
    // (undocumented)
    onSaveSuccess: () => void;
}

// @public
export const GroupQueryBuilderCustomUI: ({ updateQuery, isUpdating, resetView, }: GroupingCustomUIProps) => JSX.Element;

// @public
export const Groups: ({ mapping, actionButtonRenderers, onClickAddGroup, onClickGroupTitle, onClickGroupModify, onClickRenderContextCustomUI, disableActions, progressConfig, alert, }: GroupsProps) => JSX.Element;

// @internal (undocumented)
export const GroupsClientContext: Context<IGroupsClient>;

// @internal
export interface GroupsOperationsProps {
    // (undocumented)
    mappingId: string;
}

// @public
export interface GroupsProps {
    // (undocumented)
    actionButtonRenderers?: ActionButtonRenderer[];
    // (undocumented)
    alert?: React_3.ReactElement<typeof Alert>;
    // (undocumented)
    disableActions?: boolean;
    // (undocumented)
    isVisualizing?: boolean;
    // (undocumented)
    mapping: Mapping;
    // (undocumented)
    onClickAddGroup?: (queryGenerationType: string) => void;
    // (undocumented)
    onClickGroupModify?: (group: GroupMinimal, queryGenerationType: string) => void;
    // (undocumented)
    onClickGroupTitle?: (group: GroupMinimal) => void;
    // (undocumented)
    onClickRenderContextCustomUI?: (contextCustomUI: Exclude<ContextCustomUI["uiComponent"], undefined>, group: GroupMinimal, displayLabel: string) => void;
    // (undocumented)
    progressConfig?: ProgressConfig;
}

// @internal
export const GroupsView: ({ mapping, groups, isLoading, onRefresh, groupUIs, actionButtonRenderers, onClickAddGroup, onClickGroupTitle, onClickGroupModify, onClickRenderContextCustomUI, disableActions, selectedGroupForDeletion, onDeleteGroup, onCloseDeleteModal, setSelectedGroupForDeletion, contextUIs, alert, setActiveOverlapInfoPanelGroup, activeOverlapInfoPanelGroup, overlappedElementsInfo, progressConfig, }: GroupsViewProps) => JSX.Element;

// @internal
export interface GroupsViewProps {
    // (undocumented)
    actionButtonRenderers?: ActionButtonRenderer[];
    // (undocumented)
    activeOverlapInfoPanelGroup?: GroupMinimal | undefined;
    // (undocumented)
    alert?: React_3.ReactElement<typeof Alert>;
    // (undocumented)
    contextUIs: ContextCustomUI[];
    // (undocumented)
    disableActions?: boolean;
    // (undocumented)
    groups: GroupMinimal[];
    // (undocumented)
    groupUIs: GroupingCustomUI[];
    // (undocumented)
    isLoading: boolean;
    // (undocumented)
    mapping: Mapping;
    // (undocumented)
    onClickAddGroup?: (queryGenerationType: string) => void;
    // (undocumented)
    onClickGroupModify?: (group: GroupMinimal, queryGenerationType: string) => void;
    // (undocumented)
    onClickGroupTitle?: (group: GroupMinimal) => void;
    // (undocumented)
    onClickRenderContextCustomUI?: (contextCustomUI: Exclude<ContextCustomUI["uiComponent"], undefined>, group: GroupMinimal, displayLabel: string) => void;
    // (undocumented)
    onCloseDeleteModal: () => void;
    // (undocumented)
    onDeleteGroup: (group: GroupMinimal) => Promise<void>;
    // (undocumented)
    onRefresh: () => Promise<void>;
    // (undocumented)
    overlappedElementsInfo?: Map<string, OverlappedInfo[]>;
    // (undocumented)
    progressConfig?: ProgressConfig;
    // (undocumented)
    selectedGroupForDeletion?: GroupMinimal;
    // (undocumented)
    setActiveOverlapInfoPanelGroup?: (activeOverlapInfoPanelGroup: GroupMinimal | undefined) => void;
    // (undocumented)
    setSelectedGroupForDeletion: (group: GroupMinimal) => void;
}

// @public
export const GroupsVisualization: ({ emphasizeElements, isNonEmphasizedSelectable, onClickGroupModify, onClickAddGroup, mapping, ...rest }: GroupsVisualizationProps) => JSX.Element;

// @public
export interface GroupsVisualizationProps extends GroupsProps {
    // (undocumented)
    emphasizeElements?: boolean;
    // (undocumented)
    isNonEmphasizedSelectable?: boolean;
}

// @public (undocumented)
export interface IResult<T> {
    // (undocumented)
    errorMessage?: string;
    // (undocumented)
    value?: T;
}

// @public
export const ManualGroupingCustomUI: ({ updateQuery, isUpdating, resetView, initialEditModeQuery, }: GroupingCustomUIProps) => JSX.Element;

// @public
export const MappingAction: ({ mapping, onSaveSuccess, onClickCancel, displayStrings: userDisplayStrings }: MappingActionProps) => JSX.Element;

// @public
export interface MappingActionProps {
    // (undocumented)
    displayStrings?: Partial<typeof defaultDisplayStrings>;
    // (undocumented)
    mapping?: Mapping;
    // (undocumented)
    onClickCancel?: () => void;
    // (undocumented)
    onSaveSuccess: () => void;
}

// @internal (undocumented)
export const MappingClientContext: Context<IMappingsClient>;

// @public
export const Mappings: (props: MappingsProps) => JSX.Element;

// @internal
export interface MappingsOperationsProps extends GroupingMappingApiConfig {
    // (undocumented)
    mappingClient: IMappingsClient;
}

// @public
export interface MappingsProps {
    // (undocumented)
    displayStrings?: Partial<typeof mappingViewDefaultDisplayStrings>;
    // (undocumented)
    onClickAddMapping?: () => void;
    // (undocumented)
    onClickMappingModify?: (mapping: Mapping) => void;
    // (undocumented)
    onClickMappingTitle?: (mapping: Mapping) => void;
}

// @internal
export const MappingsView: ({ mappings, isLoading, extractionStatusData, showExtractionMessageModal, extractionMessageData, setShowExtractionMessageModal, isTogglingExtraction, onRefreshMappings, onRefreshExtractionStatus, onToggleExtraction, onDelete, showDeleteModal, setShowDeleteModal, displayStrings: userDisplayStrings, showImportModal, setShowImportModal, onClickAddMapping, onClickMappingTitle, onClickMappingModify, alert, }: MappingsViewProps) => JSX.Element;

// @internal (undocumented)
export interface MappingsViewProps {
    // (undocumented)
    alert?: React_3.ReactElement<typeof Alert>;
    // (undocumented)
    displayStrings?: Partial<typeof mappingViewDefaultDisplayStrings>;
    // (undocumented)
    extractionMessageData: ExtractionMessageData[];
    // (undocumented)
    extractionStatusData: ExtractionStatusData;
    // (undocumented)
    initialStateExtractionFlag?: boolean;
    // (undocumented)
    isLoading: boolean;
    // (undocumented)
    isTogglingExtraction: boolean;
    // (undocumented)
    mappings: Mapping[];
    // (undocumented)
    onClickAddMapping?: () => void;
    // (undocumented)
    onClickMappingModify?: (mapping: Mapping) => void;
    // (undocumented)
    onClickMappingTitle?: (mapping: Mapping) => void;
    // (undocumented)
    onDelete: (mapping: Mapping) => Promise<void>;
    // (undocumented)
    onRefreshExtractionStatus: () => Promise<void>;
    // (undocumented)
    onRefreshMappings: () => Promise<void>;
    // (undocumented)
    onToggleExtraction: (mapping: Mapping) => Promise<void>;
    // (undocumented)
    setInitialExtractionStateFlag?: (initialStateExtractionFlag: boolean) => void;
    // (undocumented)
    setShowDeleteModal: (mapping?: Mapping) => void;
    // (undocumented)
    setShowExtractionMessageModal: (show: boolean) => void;
    // (undocumented)
    setShowImportModal?: (show: boolean) => void;
    // (undocumented)
    showDeleteModal: Mapping | undefined;
    // (undocumented)
    showExtractionMessageModal: boolean;
    // (undocumented)
    showImportModal?: boolean;
}

// @internal (undocumented)
export const PropertiesClientContext: Context<IPropertiesClient>;

// @public (undocumented)
export interface PropertyMap {
    // (undocumented)
    [key: string]: PossibleDataType;
}

// @public
export const PropertyMenu: ({ mapping, group, onClickAddGroupProperty, onClickModifyGroupProperty, onClickAddCalculatedProperty, onClickModifyCalculatedProperty, onClickAddCustomCalculationProperty, onClickModifyCustomCalculation, hideGroupProps, hideCalculatedProps, hideCustomCalculationProps, }: PropertyMenuProps) => JSX.Element;

// @public
export interface PropertyMenuProps {
    // (undocumented)
    group: GroupMinimal;
    // (undocumented)
    hideCalculatedProps?: boolean;
    // (undocumented)
    hideCustomCalculationProps?: boolean;
    // (undocumented)
    hideGroupProps?: boolean;
    // (undocumented)
    mapping: Mapping;
    // (undocumented)
    onClickAddCalculatedProperty?: () => void;
    // (undocumented)
    onClickAddCustomCalculationProperty?: () => void;
    // (undocumented)
    onClickAddGroupProperty?: () => void;
    // (undocumented)
    onClickModifyCalculatedProperty?: (calculatedProperty: Property) => void;
    // (undocumented)
    onClickModifyCustomCalculation?: (customCalculation: Property) => void;
    // (undocumented)
    onClickModifyGroupProperty?: (groupProperty: Property) => void;
}

// @public
export const PropertyMenuWithVisualization: ({ group, color, ...rest }: PropertyMenuWithVisualizationProps) => JSX.Element;

// @public
export interface PropertyMenuWithVisualizationProps extends PropertyMenuProps {
    // (undocumented)
    color: string;
}

// @public
export function resolveFormulaDataType(formulaName: string, formula: string, properties: PropertyMap): IResult<DataType>;

// @public
export const SearchGroupingCustomUI: ({ updateQuery, isUpdating, resetView, }: GroupingCustomUIProps) => JSX.Element;

// @public
export const useGroupingMappingApiConfig: () => GroupingMappingApiConfig;

// @internal (undocumented)
export const useGroupsClient: () => IGroupsClient;

// @internal
export const useGroupsOperations: ({ mappingId, }: GroupsOperationsProps) => {
    groups: GroupMinimal[] | undefined;
    isLoading: boolean;
    refresh: () => Promise<void>;
    onDeleteGroup: (group: GroupMinimal) => Promise<void>;
    setShowDeleteModal: Dispatch<SetStateAction<GroupMinimal | undefined>>;
    showDeleteModal: GroupMinimal | undefined;
    groupUIs: GroupingCustomUI[];
    contextUIs: ContextCustomUI[];
    errorMessage: string | undefined;
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
    activeOverlapInfoPanelGroup: GroupMinimal | undefined;
    setActiveOverlapInfoPanelGroup: Dispatch<SetStateAction<GroupMinimal | undefined>>;
    overlappedElementsInfo: Map<string, OverlappedInfo[]>;
};

// @internal (undocumented)
export const useMappingClient: () => IMappingsClient;

// @internal
export const useMappingsOperations: ({ iModelId, getAccessToken, mappingClient }: MappingsOperationsProps) => {
    mappings: Mapping[] | undefined;
    isLoading: boolean;
    showExtractionMessageModal: boolean;
    extractionStatus: {
        extractionStatusIcon: ExtractionStatusData;
        extractionMessageData: ExtractionMessageData[];
        latestExtractionResult: IteratorResult<ExtractionStatus, any>;
    } | {
        extractionStatusIcon: {
            iconStatus: undefined;
            iconMessage: string;
        };
        extractionMessageData: never[];
    };
    setShowExtractionMessageModal: Dispatch<SetStateAction<boolean>>;
    refreshMappings: () => Promise<void>;
    refreshExtractionStatus: () => Promise<void>;
    toggleExtraction: UseMutateAsyncFunction<void, unknown, Mapping, unknown>;
    onDelete: UseMutateAsyncFunction<void, unknown, Mapping, unknown>;
    setShowImportModal: Dispatch<SetStateAction<boolean | undefined>>;
    showImportModal: boolean | undefined;
    setShowDeleteModal: Dispatch<SetStateAction<Mapping | undefined>>;
    showDeleteModal: Mapping | undefined;
    isTogglingExtraction: boolean;
};

// @internal (undocumented)
export const usePropertiesClient: () => IPropertiesClient;


export * from "@itwin/insights-client";

// (No @packageDocumentation comment for this package)

```