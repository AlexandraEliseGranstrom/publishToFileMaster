import * as React from "react";
import styles from "./ProjectInformation.module.scss";
import type { IProjectInformationProps } from "./IProjectInformationProps";
import ProjectInformationForm from "./ProjectInformationForm";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";

export default class ProjectInformation extends React.Component<
  IProjectInformationProps,
  { propertyBagData: { [key: string]: any } }
> {
  constructor(props: IProjectInformationProps) {
    super(props);

    this.state = {
      propertyBagData: {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public async componentDidMount() {
    await this.getPropertyBagData();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private async getPropertyBagData() {
    try {
      const spHttpClient: SPHttpClient = this.props.context.spHttpClient;
      const currentWebUrl: string =
        this.props.context.pageContext.web.absoluteUrl;
      const response: SPHttpClientResponse = await spHttpClient.get(
        `${currentWebUrl}/_api/web/allProperties`,
        SPHttpClient.configurations.v1
      );
      const propertyBagData: { [key: string]: any } = await response.json();
      console.log(propertyBagData);
      this.setState({ propertyBagData });
    } catch (error) {
      console.error("Error fetching property bag data:", error);
    }
  }

  public render(): React.ReactElement<IProjectInformationProps> {
    return (
      <section
        className={`${styles.projectInformation} ${
          this.props.hasTeamsContext ? styles.teams : ""
        }`}
      >
        <ProjectInformationForm
          projectName={"Rosenkrantz Terassen"}
          projectNumber={this.state.propertyBagData["ThemePrimary"]}
          projectPhase={"Tender"}
          projectStart={"2023-03-10"}
          projectEnd={"2035-03-01"}
        />
      </section>
    );
  }
}
