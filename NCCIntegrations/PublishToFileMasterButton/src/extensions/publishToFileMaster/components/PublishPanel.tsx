import * as React from "react";
import { Panel } from "@fluentui/react";
import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";

export interface IPublishPanelProps {
  onDismiss: () => void;
  isOpen: boolean;
  context: ListViewCommandSetContext;
}

export default class PublishPanel extends React.Component<
  IPublishPanelProps,
  {}
> {
  constructor(props: IPublishPanelProps) {
    super(props);
  }

  private _onClose = (): void => {
    this.props.onDismiss();
  };

  public render(): React.ReactElement<IPublishPanelProps> {
    return (
      <Panel isOpen={this.props.isOpen} onDismiss={this._onClose}>
        <h2>hej</h2>
      </Panel>
    );
  }
}
