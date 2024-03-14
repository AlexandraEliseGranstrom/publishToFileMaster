import * as strings from "ProjectInformationWebPartStrings";
import * as React from "react";
import styles from "./ProjectInformation.module.scss";

interface IProjectInformationFormProps {
  projectNumber: string;
  projectPhase: string;
  projectStart: string;
  projectEnd: string;
  projectName: string;
}

export default class ProjectInformationForm extends React.Component<
  IProjectInformationFormProps,
  {}
> {
  public render(): React.ReactElement<IProjectInformationFormProps> {
    const {
      projectNumber,
      projectPhase,
      projectStart,
      projectEnd,
      projectName,
    } = this.props;

    return (
      <div className={styles.projectInfoForm}>
        <h2>{strings.ProjectInformationHeader}</h2>
        <div>
          <strong>{strings.ProjectNameLabel}</strong>
          <p>{projectName}</p>
        </div>
        <div>
          <strong>{strings.ProjectNumberLabel}</strong>
          <p>{projectNumber}</p>
        </div>
        <div>
          <strong>{strings.ProjectPhaseLabel}</strong>
          <p>{projectPhase}</p>
        </div>
        <div>
          <strong>{strings.ProjectStartLabel}</strong>
          <p>{projectStart}</p>
        </div>
        <div>
          <strong>{strings.ProjectEndLabel}</strong>
          <p>{projectEnd}</p>
        </div>
      </div>
    );
  }
}
