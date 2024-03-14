declare interface IProjectInformationWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
  ProjectInformationHeader: string;
  ProjectNumberLabel: string;
  ProjectPhaseLabel: string;
  ProjectStartLabel: string;
  ProjectEndLabel: string;
  ProjectNameLabel: string;
}

declare module "ProjectInformationWebPartStrings" {
  const strings: IProjectInformationWebPartStrings;
  export = strings;
}
