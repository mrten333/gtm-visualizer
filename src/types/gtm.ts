export interface GTMTag {
  tagId: string;
  name: string;
  type: string;
  parameter?: Array<{
    type: string;
    key: string;
    value: string;
  }>;
  firingTriggerId?: string[];
}

export interface GTMTrigger {
  triggerId: string;
  name: string;
  type: string;
}

export interface GTMVariable {
  variableId: string;
  name: string;
  type: string;
  parameter?: Array<{
    type: string;
    key: string;
    value: string;
  }>;
}

export interface GTMContainer {
  name?: string;
  publicId?: string;
}

export interface GTMContainerVersion {
  containerVersionId?: string;
  container?: GTMContainer;
  tag?: GTMTag[];
  trigger?: GTMTrigger[];
  variable?: GTMVariable[];
}

export interface GTMExport {
  exportTime?: string;
  containerVersion: GTMContainerVersion;
}

export interface ContainerInfo {
  name: string;
  publicId: string;
  version: string;
  exportTime: string;
}
