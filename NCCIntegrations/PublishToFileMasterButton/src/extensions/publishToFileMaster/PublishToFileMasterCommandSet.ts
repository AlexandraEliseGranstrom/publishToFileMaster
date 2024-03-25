import { Log } from "@microsoft/sp-core-library";
import { override } from "@microsoft/decorators";
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs,
} from "@microsoft/sp-listview-extensibility";
import axios from "axios";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import * as strings from "PublishToFileMasterCommandSetStrings";

export interface IPublishToFileMasterCommandSetProperties {
  sampleTextOne: string;
  sampleTextTwo: string;
}

const LOG_SOURCE: string = "PublishToFileMasterCommandSet";

export default class PublishToFileMasterCommandSet extends BaseListViewCommandSet<IPublishToFileMasterCommandSetProperties> {
  private siteUrl: string;
  private listTitle: string | undefined;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, "Initialized PublishToFileMasterCommandSet");

    const compareOneCommand: Command = this.tryGetCommand("COMMAND_1");
    compareOneCommand.visible = false;
    compareOneCommand.title = strings.PublishToFileMaster;
    this.context.listView.listViewStateChangedEvent.add(
      this,
      this._onListViewStateChanged
    );
    this.siteUrl = this.context.pageContext.site.absoluteUrl;
    this.listTitle = this.context.listView.list?.title;

    return Promise.resolve();
  }

  public async onExecute(
    event: IListViewCommandSetExecuteEventParameters
  ): Promise<void> {
    switch (event.itemId) {
      case "COMMAND_1":
        // eslint-disable-next-line no-case-declarations
        const selectedRows = this.context.listView.selectedRows;

        if (selectedRows && selectedRows.length > 0) {
          const missingDocumentType: string[] = [];
          const listIds: string[] = [];
          const itemTitles: string[] = [];

          selectedRows.forEach((listItem) => {
            itemTitles.push(listItem.getValueByName("FileRef"));
            listIds.push(listItem.getValueByName("ID"));
            //help me here
            const docType = listItem.getValueByName("DocumentType");
            if (!docType) {
              missingDocumentType.push(listItem.getValueByName("ID"));
            }
          });

          if (missingDocumentType.length > 0) {
            alert(`You need to fill in document type to publish to FileMaster`);
          } else {
            await this.save(itemTitles, listIds);
          }
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
    // Extracting titles from full file paths using regex

    const extractedTitles = itemTitles.map((title) => {
      const match = title.match(/\/([^/]+)$/);
      return match ? match[1] : title;
    });

    const itemTitleList = extractedTitles
      .map((title) => `- ${title}`)
      .join("\n");

    if (
      confirm(
        `${strings.DoYouWannaPublishFilesToFileMaser}\n\n${itemTitleList}`
      ) === true
    ) {
      const noErrorsUpdatingMetadata = await this._updateListItemMetadata(
        itemIds
      );
      const noErrorsUpdatingVersions = await this._updateListItemVersions(
        itemIds
      );
      if (!noErrorsUpdatingMetadata || !noErrorsUpdatingVersions) {
        alert(strings.ProblemPublishingToFileMaster);
      } else {
        window.location.reload();
      }
    }
  };

  private _updateListItemMetadata = async (
    itemIds: string[]
  ): Promise<boolean> => {
    for (const itemId of itemIds) {
      const itemUrl = `${this.siteUrl}/_api/web/lists/getbytitle('${this.listTitle}')/items(${itemId})`;
      const metadata = await this._getMetaDataType();
      if (metadata === "") {
        return false;
      }
      const payload = JSON.stringify({
        "__metadata": {
          "type": metadata,
        },
        "Status": strings.Publish,
      });

      const options = {
        body: payload,
        headers: {
          "Accept": "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "IF-MATCH": "*",
          "X-HTTP-Method": "MERGE",
          // "X-RequestDigest": await this._getRequestDigest(this.siteUrl),
          "odata-version": "3.0",
        },
      };

      try {
        const response: SPHttpClientResponse =
          await this.context.spHttpClient.post(
            itemUrl,
            SPHttpClient.configurations.v1,
            options
          );
        if (!response.ok) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
    return true;
  };

  private _getMetaDataType = async (): Promise<string> => {
    try {
      const itemUrl = `${this.siteUrl}/_api/web/lists/getbytitle('${this.listTitle}')?$select=ListItemEntityTypeFullName`;
      const response: SPHttpClientResponse =
        await this.context.spHttpClient.get(
          itemUrl,
          SPHttpClient.configurations.v1
        );

      if (response.ok) {
        const data = await response.json();
        if (data && data.ListItemEntityTypeFullName) {
          return data.ListItemEntityTypeFullName;
        } else {
          return "";
        }
      } else {
        return "";
      }
    } catch (error) {
      return "";
    }
  };

  private _updateListItemVersions = async (
    listIds: string[]
  ): Promise<boolean> => {
    const siteUrl = this.siteUrl;
    try {
      for (const id of listIds) {
        const checkOutResponse = await this._checkOutItem(siteUrl, id);
        if (checkOutResponse.status === 200) {
          const checkInResponse = await this._checkInItem(siteUrl, id);
          if (!checkInResponse.ok) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Error occurred while updating list items:", error);
      return false;
    }
  };

  private _checkOutItem = async (
    siteUrl: string,
    id: string
  ): Promise<Response> => {
    try {
      const requestDigest = await this._getRequestDigest(siteUrl);
      return await axios.post(
        `${siteUrl}/_api/web/lists/getbytitle('${this.listTitle}')/items(${id})/File/CheckOut()`,
        null,
        {
          headers: {
            "X-HTTP-Method": "POST",
            "If-Match": "*",
            "X-RequestDigest": requestDigest,
            "Content-Type": "application/json;odata=verbose",
          },
        }
      );
    } catch (error) {
      console.error(`Error occurred while checking out item with ID ${id}:`);
      throw error;
    }
  };

  private _checkInItem = async (
    siteUrl: string,
    id: string
  ): Promise<Response> => {
    try {
      const requestDigest = await this._getRequestDigest(siteUrl);
      return await fetch(
        `${siteUrl}/_api/web/lists/getbytitle('${this.listTitle}')/items('${id}')/File/CheckIn(comment='New version for FileMaster',checkintype=1)`,
        {
          method: "POST",
          headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": requestDigest,
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE",
          },
        }
      );
    } catch (error) {
      console.error(`Error occurred while checking in item with ID ${id}:`);
      throw error;
    }
  };

  private _getRequestDigest = async (siteUrl: string): Promise<string> => {
    try {
      const response = await axios.post(`${siteUrl}/_api/contextinfo`, null, {
        headers: {
          "Accept": "application/json;odata=verbose",
        },
      });
      return response.data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      console.error("Error occurred while getting request digest");
      throw error;
    }
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
