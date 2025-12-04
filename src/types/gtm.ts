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

export interface GTMContainerVersion {
  tag?: GTMTag[];
  trigger?: GTMTrigger[];
  variable?: GTMVariable[];
}

export interface GTMExport {
  containerVersion: GTMContainerVersion;
}
