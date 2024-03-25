declare interface IPublishToFileMasterCommandSetStrings {
  Command1: string;
  Command2: string;
  DoYouWannaPublishFilesToFileMaser: string;
  Publish: string;
  NotPublished: string;
  Published: string;
  PublishToFileMaster: string;
  ProblemPublishingToFileMaster: string;
}

declare module "PublishToFileMasterCommandSetStrings" {
  const strings: IPublishToFileMasterCommandSetStrings;
  export = strings;
}
