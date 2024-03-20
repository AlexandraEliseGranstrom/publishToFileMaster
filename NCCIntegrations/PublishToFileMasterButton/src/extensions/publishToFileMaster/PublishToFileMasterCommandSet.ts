import { Log } from "@microsoft/sp-core-library";
import { override } from "@microsoft/decorators";
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs,
} from "@microsoft/sp-listview-extensibility";
import axios from "axios";
// import { IUpdateModal, UpdateModal } from "./components/UpdateModal";
// import * as ReactDom from "react-dom";
// import * as React from "react";

export interface IPublishToFileMasterCommandSetProperties {
  sampleTextOne: string;
  sampleTextTwo: string;
}

const LOG_SOURCE: string = "PublishToFileMasterCommandSet";

export default class PublishToFileMasterCommandSet extends BaseListViewCommandSet<IPublishToFileMasterCommandSetProperties> {
  private panelPlaceHolder: HTMLDivElement | null = null;
  private siteUrl: string;
  private listPath: string | undefined;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, "Initialized PublishToFileMasterCommandSet");

    const compareOneCommand: Command = this.tryGetCommand("COMMAND_1");
    compareOneCommand.visible = false;

    this.context.listView.listViewStateChangedEvent.add(
      this,
      this._onListViewStateChanged
    );
    this.siteUrl = this.context.pageContext.site.absoluteUrl;
    this.listPath = this.context.pageContext.list?.serverRelativeUrl;
    this.panelPlaceHolder = document.body.appendChild(
      document.createElement("div")
    );
    console.log(this.panelPlaceHolder);

    return Promise.resolve();
  }

  public async onExecute(
    event: IListViewCommandSetExecuteEventParameters
  ): Promise<void> {
    switch (event.itemId) {
      case "COMMAND_1":
        // eslint-disable-next-line no-case-declarations
        const selectedRows = this.context.listView.selectedRows;

        // Check if any rows are selected
        if (selectedRows && selectedRows.length > 0) {
          // Initialize an array to store list IDs
          const listIds: string[] = [];
          const itemTitles: string[] = [];

          // Iterate through selected rows to get the list IDs
          selectedRows.forEach((listItem) => {
            // Add SharePoint list item ID to the array
            itemTitles.push(listItem.getValueByName("FileRef"));
            listIds.push(listItem.getValueByName("ID"));
          });

          await this.save(itemTitles, listIds);
        }

        break;
      default:
        throw new Error("Unknown command");
    }
  }

  private save = async (
    itemTitles: string[],
    itemIds: string[]
  ): Promise<void> => {
    let userPreference;

    // Extracting titles from full file paths using regex
    const extractedTitles = itemTitles.map((title) => {
      const match = title.match(/\/([^/]+)$/); // Regex to extract filename from path
      return match ? match[1] : title; // If match found, return the filename, otherwise return the original title
    });

    // Constructing the bullet list of item titles
    const itemTitleList = extractedTitles
      .map((title) => `- ${title}`)
      .join("\n");

    if (
      confirm(
        `Do you want to publish the following file/-s to NCC FileMaster?\n\n${itemTitleList}`
      ) === true
    ) {
      await this._updateListItems(itemIds);
      userPreference = "Data saved successfully!";
    } else {
      userPreference = "Save Canceled!";
    }
    console.log(userPreference);
    console.log(this.siteUrl);
    console.log(this.listPath);
    console.log(extractedTitles, itemIds);
  };

  // // ADD FUNCTION HERE
  // private _updateListItems = (listIds: string[]): void => {
  //   //this function I want to update the listitems in the context I am in (that document library)
  //   //should use sharepoint rest APi
  //   // the ids of the items that should be updated is the ones I send in
  //   //I wanna update the version to the next major number (I have minor and major versions) when this code runs this version should be bumped.
  //   //Say the current version is 2.2 when this code runs the version should become 3.0
  //   console.log("hej");
  // };

  // private _showPanel = (items: string[]) => {
  //   this._renderPanelComponent({
  //     isOpen: true,
  //     items: items,
  //     onDismiss: this._dismissPanel,
  //   });
  // };

  // private _dismissPanel = () => {
  //   this._renderPanelComponent({ isOpen: false });
  // };

  // private _renderPanelComponent = (props: any) => {
  //   const element: React.ReactElement<IUpdateModal> = React.createElement(
  //     UpdateModal,
  //     {
  //       onDismiss: this._dismissPanel,
  //       // items: props.items,
  //       isOpen: props.isOpen,
  //       // listId: props.listId,
  //       context: this.context,
  //     },
  //     props
  //   );

  //   ReactDom.render(element, this.panelPlaceHolder);
  // };

  private _updateListItems = async (listIds: string[]): Promise<void> => {
    const siteUrl = "https://wmlps.sharepoint.com/sites/Notiser";
    try {
      for (const id of listIds) {
        const response = await axios.post(
          `${siteUrl}/_api/web/lists/getbytitle('Publish to FileMaster')/items(${id})/File/CheckOut()`,
          null,
          {
            headers: {
              "X-HTTP-Method": "POST",
              "If-Match": "*",
              "X-RequestDigest": await this._getRequestDigest(siteUrl),
              "Content-Type": "application/json;odata=verbose",
            },
          }
        );

        if (response.status === 200) {
          // Successfully checked out the file
          // Now update the metadata to increase the major version
          const updateResponse = await axios.post(
            `${siteUrl}/_api/web/lists/getbytitle('Publish to FileMaster')/items(${id})/File/CheckIn(checkintype=1)`,
            null,
            {
              headers: {
                "X-HTTP-Method": "POST",
                "If-Match": "*",
                "X-RequestDigest": await this._getRequestDigest(siteUrl),
                "Content-Type": "application/json;odata=verbose",
              },
            }
          );

          if (updateResponse.status === 204) {
            console.log(`Item with ID ${id} updated successfully.`);
          } else {
            console.error(`Failed to update item with ID ${id}.`);
          }
        } else {
          console.error(`Failed to check out item with ID ${id}.`);
        }
      }
    } catch (error) {
      console.error("Error occurred while updating list items:", error);
    }
  };

  private _getRequestDigest = async (siteUrl: string): Promise<string> => {
    const response = await axios.post(`${siteUrl}/_api/contextinfo`, null, {
      headers: {
        "Accept": "application/json;odata=verbose",
      },
    });
    return response.data.d.GetContextWebInformation.FormDigestValue;
  };

  private _onListViewStateChanged = (
    args: ListViewStateChangedEventArgs
  ): void => {
    Log.info(LOG_SOURCE, "List view state changed");

    const compareOneCommand: Command = this.tryGetCommand("COMMAND_1");
    if (compareOneCommand && this.context.listView.selectedRows) {
      // This command should be visible if at least one row is selected.
      compareOneCommand.visible =
        this.context.listView.selectedRows?.length >= 1;
    }

    this.raiseOnChange();
  };
}
