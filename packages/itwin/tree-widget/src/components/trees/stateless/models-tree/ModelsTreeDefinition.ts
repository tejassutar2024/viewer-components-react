/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  createClassBasedHierarchyDefinition, createNodesQueryClauseFactory, HierarchyNode, NodeSelectClauseColumnNames,
} from "@itwin/presentation-hierarchies";
import { createBisInstanceLabelSelectClauseFactory, ECSql } from "@itwin/presentation-shared";

import type { Id64String } from "@itwin/core-bentley";
import type {
  DefineHierarchyLevelProps,
  DefineInstanceNodeChildHierarchyLevelProps,
  DefineRootHierarchyLevelProps,
  HierarchyDefinition,
  HierarchyLevelDefinition,
  HierarchyNodeIdentifiersPath,
  HierarchyNodesDefinition,
  LimitingECSqlQueryExecutor,
  NodesQueryClauseFactory,
  ProcessedHierarchyNode,
} from "@itwin/presentation-hierarchies";

import type {
  ECClassHierarchyInspector,
  ECSchemaProvider,
  ECSqlBinding,
  ECSqlQueryExecutor,
  IInstanceLabelSelectClauseFactory,
  InstanceKey,
} from "@itwin/presentation-shared";

interface ModelsTreeDefinitionProps {
  imodelAccess: ECSchemaProvider & ECClassHierarchyInspector & ECSqlQueryExecutor;
}

interface ModelsTreeInstanceKeyPathsFromInstanceKeysProps {
  imodelAccess: ECClassHierarchyInspector & LimitingECSqlQueryExecutor;
  keys: InstanceKey[];
}

interface ModelsTreeInstanceKeyPathsFromInstanceLabelProps {
  imodelAccess: ECClassHierarchyInspector & LimitingECSqlQueryExecutor;
  label: string;
}

export type ModelsTreeInstanceKeyPathsProps = ModelsTreeInstanceKeyPathsFromInstanceKeysProps | ModelsTreeInstanceKeyPathsFromInstanceLabelProps;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace ModelsTreeInstanceKeyPathsProps {
  export function isLabelProps(props: ModelsTreeInstanceKeyPathsProps): props is ModelsTreeInstanceKeyPathsFromInstanceLabelProps {
    return !!(props as ModelsTreeInstanceKeyPathsFromInstanceLabelProps).label;
  }
}

export class ModelsTreeDefinition implements HierarchyDefinition {
  private _impl: HierarchyDefinition;
  private _subjectModelIdsCache: SubjectModelIdsCache;
  private _selectQueryFactory: NodesQueryClauseFactory;
  private _nodeLabelSelectClauseFactory: IInstanceLabelSelectClauseFactory;

  public constructor(props: ModelsTreeDefinitionProps) {
    this._impl = createClassBasedHierarchyDefinition({
      classHierarchyInspector: props.imodelAccess,
      hierarchy: {
        rootNodes: async (requestProps) => this.createRootHierarchyLevelDefinition(requestProps),
        childNodes: [
          {
            parentNodeClassName: "BisCore.Subject",
            definitions: async (requestProps: DefineInstanceNodeChildHierarchyLevelProps) => this.createSubjectChildrenQuery(requestProps),
          },
          {
            parentNodeClassName: "BisCore.ISubModeledElement",
            definitions: async (requestProps: DefineInstanceNodeChildHierarchyLevelProps) => this.createISubModeledElementChildrenQuery(requestProps),
          },
          {
            parentNodeClassName: "BisCore.GeometricModel3d",
            definitions: async (requestProps: DefineInstanceNodeChildHierarchyLevelProps) => this.createGeometricModel3dChildrenQuery(requestProps),
          },
          {
            parentNodeClassName: "BisCore.SpatialCategory",
            definitions: async (requestProps: DefineInstanceNodeChildHierarchyLevelProps) => this.createSpatialCategoryChildrenQuery(requestProps),
          },
          {
            parentNodeClassName: "BisCore.GeometricElement3d",
            definitions: async (requestProps: DefineInstanceNodeChildHierarchyLevelProps) => this.createGeometricElement3dChildrenQuery(requestProps),
          },
        ],
      },
    });
    this._subjectModelIdsCache = new SubjectModelIdsCache(props.imodelAccess);
    this._selectQueryFactory = createNodesQueryClauseFactory({ imodelAccess: props.imodelAccess });
    this._nodeLabelSelectClauseFactory = createBisInstanceLabelSelectClauseFactory({ classHierarchyInspector: props.imodelAccess });
  }

  public async postProcessNode(node: ProcessedHierarchyNode): Promise<ProcessedHierarchyNode> {
    if (HierarchyNode.isClassGroupingNode(node)) {
      // `imageId` is assigned to instance nodes at query time, but grouping ones need to
      // be handled during post-processing
      // Add `modelId` and `categoryId` from the first grouped element.
      const childExtendedData = node.children[0].extendedData;
      return { ...node, extendedData: { ...node.extendedData, ...childExtendedData, imageId: "icon-ec-class" } };
    }
    return node;
  }

  public async defineHierarchyLevel(props: DefineHierarchyLevelProps) {
    return this._impl.defineHierarchyLevel(props);
  }

  private async createRootHierarchyLevelDefinition(props: DefineRootHierarchyLevelProps): Promise<HierarchyLevelDefinition> {
    const instanceFilterClauses = await this._selectQueryFactory.createFilterClauses({
      filter: props.instanceFilter,
      contentClass: { fullName: "BisCore.Subject", alias: "this" },
    });
    return [
      {
        fullClassName: "BisCore.Subject",
        query: {
          ecsql: `
            SELECT
              ${await this._selectQueryFactory.createSelectClause({
                ecClassId: { selector: ECSql.createRawPropertyValueSelector("this", "ECClassId") },
                ecInstanceId: { selector: "this.ECInstanceId" },
                nodeLabel: {
                  selector: await this._nodeLabelSelectClauseFactory.createSelectClause({
                    classAlias: "this",
                    className: "BisCore.Subject",
                  }),
                },
                extendedData: {
                  imageId: "icon-imodel-hollow-2",
                  isSubject: true,
                },
                autoExpand: true,
                supportsFiltering: true,
              })}
            FROM ${instanceFilterClauses.from} this
            ${instanceFilterClauses.joins}
            WHERE
              this.Parent IS NULL
              ${instanceFilterClauses.where ? `AND ${instanceFilterClauses.where}` : ""}
          `,
        },
      },
    ];
  }

  private async createSubjectChildrenQuery({
    parentNodeInstanceIds: subjectIds,
    instanceFilter,
  }: DefineInstanceNodeChildHierarchyLevelProps): Promise<HierarchyLevelDefinition> {
    const [subjectFilterClauses, modelFilterClauses] = await Promise.all([
      this._selectQueryFactory.createFilterClauses({
        filter: instanceFilter,
        contentClass: { fullName: "BisCore.Subject", alias: "this" },
      }),
      this._selectQueryFactory.createFilterClauses({
        filter: instanceFilter,
        contentClass: { fullName: "BisCore.GeometricModel3d", alias: "this" },
      }),
    ]);
    const [childSubjectIds, childModelIds] = await Promise.all([
      this._subjectModelIdsCache.getChildSubjectIds(subjectIds),
      this._subjectModelIdsCache.getSubjectModelIds(subjectIds),
    ]);
    const defs = new Array<HierarchyNodesDefinition>();
    childSubjectIds.length &&
      defs.push({
        fullClassName: "BisCore.Subject",
        query: {
          ecsql: `
            SELECT
              ${await this._selectQueryFactory.createSelectClause({
                ecClassId: { selector: "this.ECClassId" },
                ecInstanceId: { selector: "this.ECInstanceId" },
                nodeLabel: {
                  selector: await this._nodeLabelSelectClauseFactory.createSelectClause({
                    classAlias: "this",
                    className: "BisCore.Subject",
                  }),
                },
                hideIfNoChildren: true,
                hasChildren: { selector: `InVirtualSet(?, this.ECInstanceId)` },
                grouping: { byLabel: { action: "merge", groupId: "subject" } },
                extendedData: {
                  imageId: "icon-folder",
                  isSubject: true,
                },
                supportsFiltering: true,
              })}
            FROM ${subjectFilterClauses.from} this
            ${subjectFilterClauses.joins}
            WHERE
              this.ECInstanceId IN (${childSubjectIds.map(() => "?").join(",")})
              ${subjectFilterClauses.where ? `AND ${subjectFilterClauses.where}` : ""}
          `,
          bindings: [
            { type: "idset", value: await this._subjectModelIdsCache.getParentSubjectIds() },
            ...childSubjectIds.map((id): ECSqlBinding => ({ type: "id", value: id })),
          ],
        },
      });
    childModelIds.length &&
      defs.push({
        fullClassName: "BisCore.GeometricModel3d",
        query: {
          ecsql: `
            SELECT model.ECInstanceId AS ECInstanceId, model.*
            FROM (
              SELECT
                ${await this._selectQueryFactory.createSelectClause({
                  ecClassId: { selector: "model.ECClassId" },
                  ecInstanceId: { selector: "model.ECInstanceId" },
                  nodeLabel: {
                    selector: await this._nodeLabelSelectClauseFactory.createSelectClause({
                      classAlias: "partition",
                      className: "BisCore.InformationPartitionElement",
                    }),
                  },
                  hideNodeInHierarchy: {
                    selector: `
                      CASE
                        WHEN (
                          json_extract([partition].JsonProperties, '$.PhysicalPartition.Model.Content') IS NOT NULL
                          OR json_extract([partition].JsonProperties, '$.GraphicalPartition3d.Model.Content') IS NOT NULL
                        ) THEN 1
                        ELSE 0
                      END
                    `,
                  },
                  hasChildren: true,
                  extendedData: {
                    imageId: "icon-model",
                    isModel: true,
                  },
                  supportsFiltering: true,
                })}
              FROM Bis.GeometricModel3d model
              JOIN bis.InformationPartitionElement [partition] ON [partition].ECInstanceId = model.ModeledElement.Id
              WHERE
                model.ECInstanceId IN (${childModelIds.map(() => "?").join(",")})
            ) model
            JOIN ${modelFilterClauses.from} this ON this.ECInstanceId = model.ECInstanceId
            ${modelFilterClauses.joins}
            ${modelFilterClauses.where ? `AND (model.${NodeSelectClauseColumnNames.HideNodeInHierarchy} OR ${modelFilterClauses.where})` : ""}
          `,
          bindings: childModelIds.map((id): ECSqlBinding => ({ type: "id", value: id })),
        },
      });
    return defs;
  }

  private async createISubModeledElementChildrenQuery({
    parentNodeInstanceIds: elementIds,
  }: DefineInstanceNodeChildHierarchyLevelProps): Promise<HierarchyLevelDefinition> {
    // note: we do not apply hierarchy level filtering on this hierarchy level, because it's always
    // hidden - the filter will get applied on the child hierarchy levels
    return [
      {
        fullClassName: "BisCore.GeometricModel3d",
        query: {
          ecsql: `
            SELECT
              ${await this._selectQueryFactory.createSelectClause({
                ecClassId: { selector: "this.ECClassId" },
                ecInstanceId: { selector: "this.ECInstanceId" },
                nodeLabel: "", // doesn't matter - the node is always hidden
                hideNodeInHierarchy: true,
              })}
            FROM BisCore.GeometricModel3d this
            WHERE
              this.ModeledElement.Id IN (${elementIds.map(() => "?").join(",")})
              AND NOT this.IsPrivate
              AND this.ECInstanceId IN (SELECT Model.Id FROM bis.GeometricElement3d)
          `,
          bindings: [...elementIds.map((id): ECSqlBinding => ({ type: "id", value: id }))],
        },
      },
    ];
  }

  private async createGeometricModel3dChildrenQuery({
    parentNodeInstanceIds: modelIds,
    instanceFilter,
  }: DefineInstanceNodeChildHierarchyLevelProps): Promise<HierarchyLevelDefinition> {
    function createModelIdsSelector(): string {
      // Note: `json_array` function only accepts up to 127 arguments and we may have more `modelIds` than that. As a workaround,
      // we're creating an array of arrays
      const slices = new Array<Id64String[]>();
      for (let sliceStartIndex = 0; sliceStartIndex < modelIds.length; sliceStartIndex += 127) {
        let sliceEndIndex: number | undefined = sliceStartIndex + 127;
        if (sliceEndIndex > modelIds.length) {
          sliceEndIndex = undefined;
        }
        slices.push(modelIds.slice(sliceStartIndex, sliceEndIndex));
      }
      return `json_array(${slices.map((sliceIds) => `json_array(${sliceIds.map((id) => `'${id}'`).join(",")})`).join(",")})`;
    }
    const instanceFilterClauses = await this._selectQueryFactory.createFilterClauses({
      filter: instanceFilter,
      contentClass: { fullName: "BisCore.SpatialCategory", alias: "this" },
    });
    return [
      {
        fullClassName: "BisCore.SpatialCategory",
        query: {
          ecsql: `
            SELECT
              ${await this._selectQueryFactory.createSelectClause({
                ecClassId: { selector: "this.ECClassId" },
                ecInstanceId: { selector: "this.ECInstanceId" },
                nodeLabel: {
                  selector: await this._nodeLabelSelectClauseFactory.createSelectClause({
                    classAlias: "this",
                    className: "BisCore.SpatialCategory",
                  }),
                },
                grouping: { byLabel: { action: "merge", groupId: "category" } },
                hasChildren: true,
                extendedData: {
                  imageId: "icon-layers",
                  isCategory: true,
                  modelIds: { selector: createModelIdsSelector() },
                },
                supportsFiltering: true,
              })}
            FROM ${instanceFilterClauses.from} this
            ${instanceFilterClauses.joins}
            WHERE
              EXISTS (
                SELECT 1
                FROM bis.GeometricElement3d element
                WHERE
                  element.Model.Id IN (${modelIds.map(() => "?").join(",")})
                  AND element.Category.Id = +this.ECInstanceId
                  AND element.Parent IS NULL
              )
              ${instanceFilterClauses.where ? `AND ${instanceFilterClauses.where}` : ""}
          `,
          bindings: modelIds.map((id) => ({ type: "id", value: id })),
        },
      },
    ];
  }

  private async createSpatialCategoryChildrenQuery({
    parentNodeInstanceIds: categoryIds,
    parentNode,
    instanceFilter,
  }: DefineInstanceNodeChildHierarchyLevelProps): Promise<HierarchyLevelDefinition> {
    const modelIds: Id64String[] =
      parentNode.extendedData && parentNode.extendedData.hasOwnProperty("modelIds") && Array.isArray(parentNode.extendedData.modelIds)
        ? parentNode.extendedData.modelIds.reduce(
            (arr, ids: Id64String | Id64String[]) => [...arr, ...(Array.isArray(ids) ? ids : [ids])],
            new Array<Id64String>(),
          )
        : [];
    if (modelIds.length === 0) {
      throw new Error(`Invalid category node "${parentNode.label}" - missing model information.`);
    }
    const instanceFilterClauses = await this._selectQueryFactory.createFilterClauses({
      filter: instanceFilter,
      contentClass: { fullName: "BisCore.GeometricElement3d", alias: "this" },
    });
    return [
      {
        fullClassName: "BisCore.GeometricElement3d",
        query: {
          ecsql: `
            SELECT
              ${await this._selectQueryFactory.createSelectClause({
                ecClassId: { selector: "this.ECClassId" },
                ecInstanceId: { selector: "this.ECInstanceId" },
                nodeLabel: {
                  selector: await this._nodeLabelSelectClauseFactory.createSelectClause({
                    classAlias: "this",
                    className: "BisCore.GeometricElement3d",
                  }),
                },
                grouping: {
                  byClass: true,
                },
                hasChildren: {
                  selector: `
                    IFNULL((
                      SELECT 1
                      FROM (
                        SELECT Parent.Id ParentId FROM bis.GeometricElement3d
                        UNION ALL
                        SELECT ModeledElement.Id ParentId FROM bis.GeometricModel3d
                      )
                      WHERE ParentId = this.ECInstanceId
                      LIMIT 1
                    ), 0)
                  `,
                },
                extendedData: {
                  modelId: { selector: "printf('0x%x', this.Model.Id)" },
                  categoryId: { selector: "printf('0x%x', this.Category.Id)" },
                  imageId: "icon-item",
                },
                supportsFiltering: true,
              })}
            FROM ${instanceFilterClauses.from} this
            ${instanceFilterClauses.joins}
            WHERE
              this.Category.Id IN (${categoryIds.map(() => "?").join(",")})
              AND this.Model.Id IN (${modelIds.map(() => "?").join(",")})
              AND this.Parent IS NULL
              ${instanceFilterClauses.where ? `AND ${instanceFilterClauses.where}` : ""}
          `,
          bindings: [...categoryIds.map((id) => ({ type: "id", value: id })), ...modelIds.map((id) => ({ type: "id", value: id }))] as ECSqlBinding[],
        },
      },
    ];
  }

  private async createGeometricElement3dChildrenQuery({
    parentNodeInstanceIds: elementIds,
    instanceFilter,
  }: DefineInstanceNodeChildHierarchyLevelProps): Promise<HierarchyLevelDefinition> {
    const instanceFilterClauses = await this._selectQueryFactory.createFilterClauses({
      filter: instanceFilter,
      contentClass: { fullName: "BisCore.GeometricElement3d", alias: "this" },
    });
    return [
      {
        fullClassName: "BisCore.GeometricElement3d",
        query: {
          ecsql: `
            SELECT
              ${await this._selectQueryFactory.createSelectClause({
                ecClassId: { selector: "this.ECClassId" },
                ecInstanceId: { selector: "this.ECInstanceId" },
                nodeLabel: {
                  selector: await this._nodeLabelSelectClauseFactory.createSelectClause({
                    classAlias: "this",
                    className: "BisCore.GeometricElement3d",
                  }),
                },
                grouping: {
                  byClass: true,
                },
                hasChildren: {
                  selector: `
                    IFNULL((
                      SELECT 1
                      FROM (
                        SELECT Parent.Id ParentId FROM bis.GeometricElement3d
                        UNION ALL
                        SELECT ModeledElement.Id ParentId FROM bis.GeometricModel3d
                      )
                      WHERE ParentId = this.ECInstanceId
                      LIMIT 1
                    ), 0)
                  `,
                },
                extendedData: {
                  modelId: { selector: "printf('0x%x', this.Model.Id)" },
                  categoryId: { selector: "printf('0x%x', this.Category.Id)" },
                  imageId: "icon-item",
                },
                supportsFiltering: true,
              })}
            FROM ${instanceFilterClauses.from} this
            ${instanceFilterClauses.joins}
            WHERE
              this.Parent.Id IN (${elementIds.map(() => "?").join(",")})
              ${instanceFilterClauses.where ? `AND ${instanceFilterClauses.where}` : ""}
          `,
          bindings: elementIds.map((id) => ({ type: "id", value: id })),
        },
      },
    ];
  }

  public static async createInstanceKeyPaths(props: ModelsTreeInstanceKeyPathsProps) {
    if (ModelsTreeInstanceKeyPathsProps.isLabelProps(props)) {
      const labelsFactory = createBisInstanceLabelSelectClauseFactory({ classHierarchyInspector: props.imodelAccess });
      return createInstanceKeyPathsFromInstanceLabel({ ...props, labelsFactory });
    }
    return createInstanceKeyPathsFromInstanceKeys(props);
  }
}

class SubjectModelIdsCache {
  private _subjectsHierarchy: Map<Id64String, Set<Id64String>> | undefined;
  private _subjectModels: Map<Id64String, Set<Id64String>> | undefined;
  private _subjectInfos: Map<Id64String, { hideInHierarchy: boolean }> | undefined;
  private _parentSubjectIds: Promise<Id64String[]> | undefined; // the list should contain a subject id if its node should be shown as having children
  private _init: Promise<void> | undefined;

  constructor(private _queryExecutor: ECSqlQueryExecutor) {}

  private async *querySubjects(): AsyncIterableIterator<{ id: Id64String; parentId?: Id64String; targetPartitionId?: Id64String; hideInHierarchy: boolean }> {
    const subjectsQuery = `
      SELECT
        ECInstanceId id,
        Parent.Id parentId,
        json_extract(JsonProperties, '$.Subject.Model.TargetPartition') targetPartitionId,
        CASE
          WHEN (
            json_extract(JsonProperties, '$.Subject.Job.Bridge') IS NOT NULL
            OR json_extract(JsonProperties, '$.Subject.Model.Type') = 'Hierarchy'
          ) THEN 1
          ELSE 0
        END hideInHierarchy
      FROM bis.Subject
    `;
    for await (const row of this._queryExecutor.createQueryReader({ ecsql: subjectsQuery }, { rowFormat: "ECSqlPropertyNames" })) {
      yield { id: row.id, parentId: row.parentId, targetPartitionId: row.targetPartitionId, hideInHierarchy: !!row.hideInHierarchy };
    }
  }

  private async *queryModels(): AsyncIterableIterator<{ id: Id64String; parentId: Id64String }> {
    const modelsQuery = `
      SELECT p.ECInstanceId id, p.Parent.Id parentId
      FROM bis.InformationPartitionElement p
      INNER JOIN bis.GeometricModel3d m ON m.ModeledElement.Id = p.ECInstanceId
      WHERE NOT m.IsPrivate AND EXISTS (SELECT 1 FROM bis.GeometricElement3d WHERE Model.Id = m.ECInstanceId)
    `;
    for await (const row of this._queryExecutor.createQueryReader({ ecsql: modelsQuery }, { rowFormat: "ECSqlPropertyNames" })) {
      yield { id: row.id, parentId: row.parentId };
    }
  }

  private async initSubjectModels() {
    this._subjectsHierarchy = new Map();
    this._subjectModels = new Map();
    this._subjectInfos = new Map();
    const targetPartitionSubjects = new Map<Id64String, Set<Id64String>>();
    await Promise.all([
      (async () => {
        for await (const subject of this.querySubjects()) {
          this._subjectInfos!.set(subject.id, { hideInHierarchy: subject.hideInHierarchy });
          if (subject.parentId) {
            pushToMap(this._subjectsHierarchy!, subject.parentId, subject.id);
          }
          if (subject.targetPartitionId) {
            pushToMap(targetPartitionSubjects, subject.targetPartitionId, subject.id);
          }
        }
      })(),
      (async () => {
        for await (const model of this.queryModels()) {
          pushToMap(targetPartitionSubjects, model.id, model.parentId);
        }
      })(),
    ]);
    for (const [partitionId, subjectIds] of targetPartitionSubjects) {
      subjectIds.forEach((subjectId) => {
        pushToMap(this._subjectModels!, subjectId, partitionId);
      });
    }
  }

  private async initCache() {
    if (!this._init) {
      this._init = this.initSubjectModels();
    }
    return this._init;
  }

  private forEachChildSubject(parentSubjectId: Id64String, cb: (childSubjectId: Id64String) => "break" | "continue") {
    const childSubjectIds = this._subjectsHierarchy!.get(parentSubjectId);
    childSubjectIds &&
      childSubjectIds.forEach((childSubjectId) => {
        if (cb(childSubjectId) === "break") {
          return;
        }
        this.forEachChildSubject(childSubjectId, cb);
      });
  }

  public async getParentSubjectIds(): Promise<Id64String[]> {
    this._parentSubjectIds ??= (async () => {
      await this.initCache();
      const hasChildModels = (subjectId: Id64String) => {
        if ((this._subjectModels!.get(subjectId)?.size ?? 0) > 0) {
          return true;
        }
        const childSubjectIds = this._subjectsHierarchy!.get(subjectId);
        return childSubjectIds && [...childSubjectIds].some(hasChildModels);
      };
      const parentSubjectIds = new Set<Id64String>();
      const addIfHasChildren = (subjectId: Id64String) => {
        if (hasChildModels(subjectId)) {
          parentSubjectIds.add(subjectId);
        }
      };
      this._subjectsHierarchy!.forEach((childSubjectIds, parentSubjectId) => {
        addIfHasChildren(parentSubjectId);
        childSubjectIds.forEach(addIfHasChildren);
      });
      return [...parentSubjectIds];
    })();
    return this._parentSubjectIds;
  }

  public async getChildSubjectIds(parentSubjectIds: Id64String[]): Promise<Id64String[]> {
    await this.initCache();
    const childSubjectIds = new Array<Id64String>();
    parentSubjectIds.forEach((subjectId) => {
      this.forEachChildSubject(subjectId, (childSubjectId) => {
        const { hideInHierarchy } = this._subjectInfos!.get(childSubjectId)!;
        if (!hideInHierarchy) {
          childSubjectIds.push(childSubjectId);
          return "break";
        }
        return "continue";
      });
    });
    return childSubjectIds;
  }

  public async getSubjectModelIds(parentSubjectIds: Id64String[]): Promise<Id64String[]> {
    await this.initCache();

    const hiddenSubjectIds = new Array<Id64String>();
    parentSubjectIds.forEach((subjectId) => {
      this.forEachChildSubject(subjectId, (childSubjectId) => {
        const { hideInHierarchy } = this._subjectInfos!.get(childSubjectId)!;
        if (hideInHierarchy) {
          hiddenSubjectIds.push(childSubjectId);
          return "continue";
        }
        return "break";
      });
    });

    const modelIds = new Array<Id64String>();
    [...parentSubjectIds, ...hiddenSubjectIds].forEach((subjectId) => {
      const subjectModelIds = this._subjectModels!.get(subjectId);
      subjectModelIds && modelIds.push(...subjectModelIds);
    });
    return modelIds;
  }
}

function pushToMap<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey, value: TValue) {
  let list = map.get(key);
  if (!list) {
    list = new Set();
    map.set(key, list);
  }
  list.add(value);
}

function createECInstanceKeySelectClause(
  props: (({ classIdSelector: string } | { classIdAlias: string }) & ({ instanceHexIdSelector: string } | { instanceIdAlias: string })) | { alias: string },
) {
  const classIdSelector = (props as any).classIdSelector ?? `[${(props as any).classIdAlias ?? (props as any).alias}].[ECClassId]`;
  const instanceHexIdSelector =
    (props as any).instanceHexIdSelector ?? `printf('0x%x', [${(props as any).instanceIdAlias ?? (props as any).alias}].[ECInstanceId])`;
  return `json_object('className', ec_classname(${classIdSelector}, 's.c'), 'id', ${instanceHexIdSelector})`;
}

async function createSubjectModelsInstanceKeysPathsCTEs(labelsFactory: IInstanceLabelSelectClauseFactory) {
  return [
    `Models(ECClassId, ECInstanceId, HexId, ModeledElementParentId, Label) AS (
      SELECT
        m.ECClassId,
        m.ECInstanceId,
        printf('0x%x', m.ECInstanceId) HexId,
        p.Parent.Id,
        ${await labelsFactory.createSelectClause({
          classAlias: "p",
          className: "BisCore.Element",
          // eslint-disable-next-line @typescript-eslint/unbound-method
          selectorsConcatenator: ECSql.createConcatenatedValueStringSelector,
        })}
      FROM bis.GeometricModel3d m
      JOIN bis.Element p on p.ECInstanceId = m.ModeledElement.Id
    )`,
    `SubjectsHierarchy(TargetId, TargetLabel, ECClassId, ECInstanceId, ParentId, JsonProperties, Path) AS (
      SELECT
        s.ECInstanceId,
        ${await labelsFactory.createSelectClause({
          classAlias: "s",
          className: "BisCore.Subject",
          // eslint-disable-next-line @typescript-eslint/unbound-method
          selectorsConcatenator: ECSql.createConcatenatedValueStringSelector,
        })},
        s.ECClassId,
        s.ECInstanceId,
        s.Parent.Id,
        s.JsonProperties,
        CASE
          WHEN (
            json_extract(s.JsonProperties, '$.Subject.Job.Bridge') IS NOT NULL
            OR json_extract(s.JsonProperties, '$.Subject.Model.Type') = 'Hierarchy'
          )
          THEN
            json_array()
          ELSE
            json_array(${createECInstanceKeySelectClause({ alias: "s" })})
        END
      FROM bis.Subject s
      UNION ALL
      SELECT
        c.TargetId,
        c.TargetLabel,
        p.ECClassId,
        p.ECInstanceId,
        p.Parent.Id,
        p.JsonProperties,
        CASE
          WHEN (
            json_extract(p.JsonProperties, '$.Subject.Job.Bridge') IS NOT NULL
            OR json_extract(p.JsonProperties, '$.Subject.Model.Type') = 'Hierarchy'
          )
          THEN
            c.Path
          ELSE
            json_insert(c.Path, '$[#]', ${createECInstanceKeySelectClause({ alias: "p" })})
        END
      FROM SubjectsHierarchy c
      JOIN bis.Element p on p.ECInstanceId = c.ParentId
    )`,
    `Subjects(TargetId, TargetLabel, ECClassId, ECInstanceId, JsonProperties, Path) AS (
      SELECT s.TargetId, s.TargetLabel, s.ECClassId, s.ECInstanceId, s.JsonProperties, s.Path
      FROM SubjectsHierarchy s
      WHERE s.ParentId IS NULL
    )`,
  ];
}

async function createInstanceKeyPathsCTEs(labelsFactory: IInstanceLabelSelectClauseFactory) {
  return [
    `GeometricElementsHierarchy(TargetId, TargetLabel, ECClassId, ECInstanceId, ParentId, ModelId, CategoryId, Path) AS (
      SELECT
        e.ECInstanceId,
        ${await labelsFactory.createSelectClause({
          classAlias: "e",
          className: "BisCore.GeometricElement3d",
          // eslint-disable-next-line @typescript-eslint/unbound-method
          selectorsConcatenator: ECSql.createConcatenatedValueStringSelector,
        })},
        e.ECClassId,
        e.ECInstanceId,
        e.Parent.Id,
        e.Model.Id,
        e.Category.Id,
        json_array(${createECInstanceKeySelectClause({ alias: "e" })})
      FROM bis.GeometricElement3d e
      UNION ALL
      SELECT
        c.TargetId,
        c.TargetLabel,
        p.ECClassId,
        p.ECInstanceId,
        p.Parent.Id,
        p.Model.Id,
        p.Category.Id,
        json_insert(c.Path, '$[#]', ${createECInstanceKeySelectClause({ alias: "p" })})
      FROM GeometricElementsHierarchy c
      JOIN bis.GeometricElement3d p on p.ECInstanceId = c.ParentId
    )`,
    `GeometricElements(TargetId, TargetLabel, ECClassId, ECInstanceId, ModelId, CategoryId, Path) AS (
      SELECT e.TargetId, e.TargetLabel, e.ECClassId, e.ECInstanceId, e.ModelId, e.CategoryId, e.Path
      FROM GeometricElementsHierarchy e
      WHERE e.ParentId IS NULL
    )`,
    `Categories(ECClassId, ECInstanceId, HexId, Label) AS (
      SELECT
        c.ECClassId,
        c.ECInstanceId,
        printf('0x%x', c.ECInstanceId) HexId,
        ${await labelsFactory.createSelectClause({
          classAlias: "c",
          className: "BisCore.SpatialCategory",
          // eslint-disable-next-line @typescript-eslint/unbound-method
          selectorsConcatenator: ECSql.createConcatenatedValueStringSelector,
        })}
      FROM bis.SpatialCategory c
    )`,
    `ModelsCategoriesElementsHierarchy(TargetElementId, TargetElementLabel, ModelId, ModelHexId, ModelParentId, Path) AS (
      SELECT
        e.TargetId,
        e.TargetLabel,
        m.ECInstanceId,
        m.HexId,
        m.ModeledElementParentId,
        json_insert(
          e.Path,
          '$[#]', ${createECInstanceKeySelectClause({
            classIdAlias: "c",
            instanceHexIdSelector: "c.HexId",
          })},
          '$[#]', ${createECInstanceKeySelectClause({
            classIdAlias: "m",
            instanceHexIdSelector: "m.HexId",
          })}
        )
      FROM GeometricElements e
      JOIN Categories c ON c.ECInstanceId = e.CategoryId
      JOIN Models m ON m.ECInstanceId = e.ModelId
      UNION ALL
      SELECT
        mce.TargetElementId,
        mce.TargetElementLabel,
        m.ECInstanceId,
        m.HexId,
        m.ModeledElementParentId,
        json_insert(
          mce.Path,
          '$[#]', json(e.Path),
          '$[#]', ${createECInstanceKeySelectClause({
            classIdAlias: "c",
            instanceHexIdSelector: "c.HexId",
          })},
          '$[#]', ${createECInstanceKeySelectClause({
            classIdAlias: "m",
            instanceHexIdSelector: "m.HexId",
          })}
        )
      FROM ModelsCategoriesElementsHierarchy mce
      JOIN GeometricElements e on e.TargetId = mce.ModelId
      JOIN Categories c ON c.ECInstanceId = e.CategoryId
      JOIN Models m ON m.ECInstanceId = e.ModelId
    )`,
    ...(await createSubjectModelsInstanceKeysPathsCTEs(labelsFactory)),
  ];
}

async function createInstanceKeyPathsFromInstanceKeys(props: ModelsTreeInstanceKeyPathsFromInstanceKeysProps): Promise<HierarchyNodeIdentifiersPath[]> {
  const ids = {
    models: new Array<Id64String>(),
    categories: new Array<Id64String>(),
    subjects: new Array<Id64String>(),
    elements: new Array<Id64String>(),
  };
  await Promise.all(
    props.keys.map(async (key) => {
      if (await props.imodelAccess.classDerivesFrom(key.className, "BisCore.Subject")) {
        ids.subjects.push(key.id);
      } else if (await props.imodelAccess.classDerivesFrom(key.className, "BisCore.Model")) {
        ids.models.push(key.id);
      } else if (await props.imodelAccess.classDerivesFrom(key.className, "BisCore.SpatialCategory")) {
        ids.categories.push(key.id);
      } else {
        ids.elements.push(key.id);
      }
    }),
  );

  const queries = [];
  if (ids.elements.length > 0) {
    queries.push(`
      SELECT json_insert(mce.Path, '$[#]', json(s.Path))
      FROM ModelsCategoriesElementsHierarchy mce
      JOIN Subjects s ON s.TargetId = mce.ModelParentId OR json_extract(s.JsonProperties,'$.Subject.Model.TargetPartition') = mce.ModelHexId
      WHERE mce.TargetElementId IN (${ids.elements.map(() => "?").join(",")})
    `);
  }
  if (ids.categories.length > 0) {
    queries.push(`
      SELECT
        json_array(
          ${createECInstanceKeySelectClause({ classIdAlias: "c", instanceHexIdSelector: "c.HexId" })},
          ${createECInstanceKeySelectClause({ classIdAlias: "m", instanceHexIdSelector: "m.HexId" })},
          json(s.Path)
        )
      FROM Categories c,
           Models m
      JOIN Subjects s ON s.TargetId = m.ModeledElementParentId OR json_extract(s.JsonProperties,'$.Subject.Model.TargetPartition') = m.HexId
      WHERE
        m.ECInstanceId IN (SELECT e.Model.Id FROM bis.GeometricElement3d e WHERE e.Category.Id = c.ECInstanceId)
        AND c.ECInstanceId IN (${ids.categories.map(() => "?").join(",")})
    `);
  }
  if (ids.models.length > 0) {
    queries.push(`
      SELECT
        json_array(
          ${createECInstanceKeySelectClause({ classIdAlias: "m", instanceHexIdSelector: "m.HexId" })},
          json(s.Path)
        )
      FROM Models m
      JOIN Subjects s ON s.TargetId = m.ModeledElementParentId OR json_extract(s.JsonProperties,'$.Subject.Model.TargetPartition') = m.HexId
      WHERE m.ECInstanceId IN (${ids.models.map(() => "?").join(",")})
    `);
  }
  if (ids.subjects.length > 0) {
    queries.push(`
      SELECT s.Path
      FROM Subjects s
      WHERE s.TargetId IN (${ids.subjects.map(() => "?").join(",")})
    `);
  }
  if (queries.length === 0) {
    return [];
  }

  const bindings: ECSqlBinding[] = [];
  ids.elements.forEach((id) => bindings.push({ type: "id", value: id }));
  ids.categories.forEach((id) => bindings.push({ type: "id", value: id }));
  ids.models.forEach((id) => bindings.push({ type: "id", value: id }));
  ids.subjects.forEach((id) => bindings.push({ type: "id", value: id }));

  const reader = props.imodelAccess.createQueryReader(
    {
      ctes: await createInstanceKeyPathsCTEs({ createSelectClause: async () => "''" }),
      ecsql: queries.join(" UNION ALL "),
      bindings,
    },
    { rowFormat: "Indexes", restartToken: "tree-widget/models-tree/filter-by-keys-query" },
  );
  const paths = new Array<HierarchyNodeIdentifiersPath>();
  for await (const row of reader) {
    paths.push(flatten<InstanceKey>(JSON.parse(row[0])).reverse());
  }
  return paths;
}

async function createInstanceKeyPathsFromInstanceLabel(
  props: ModelsTreeInstanceKeyPathsFromInstanceLabelProps & { labelsFactory: IInstanceLabelSelectClauseFactory },
) {
  const queries = [];
  queries.push(`
    SELECT
      m.Label AS Label,
      json_array(
        ${createECInstanceKeySelectClause({ classIdAlias: "m", instanceHexIdSelector: "m.HexId" })},
        json(s.Path)
      ) AS Path
    FROM Models m
    JOIN Subjects s ON s.TargetId = m.ModeledElementParentId OR json_extract(s.JsonProperties,'$.Subject.Model.TargetPartition') = m.HexId
  `);
  queries.push(`
    SELECT s.TargetLabel AS Label, s.Path AS Path
    FROM Subjects s
  `);

  const reader = props.imodelAccess.createQueryReader(
    {
      ctes: await createSubjectModelsInstanceKeysPathsCTEs(props.labelsFactory),
      ecsql: `
        SELECT DISTINCT Path
        FROM (
          ${queries.join(" UNION ALL ")}
        )
        WHERE Label LIKE '%' || ? || '%'
      `,
      bindings: [{ type: "string", value: props.label }],
    },
    { rowFormat: "Indexes", restartToken: "tree-widget/models-tree/filter-by-label-query" },
  );
  const paths = new Array<HierarchyNodeIdentifiersPath>();
  for await (const row of reader) {
    paths.push(flatten<InstanceKey>(JSON.parse(row[0])).reverse());
  }
  return paths;
}

type ArrayOrValue<T> = T | Array<ArrayOrValue<T>>;
function flatten<T>(source: Array<ArrayOrValue<T>>): T[] {
  return source.reduce<T[]>((flat, item): T[] => {
    return [...flat, ...(Array.isArray(item) ? flatten(item) : [item])];
  }, new Array<T>());
}
