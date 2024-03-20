import {
  DefaultButton,
  DialogFooter,
  Modal,
  PrimaryButton,
  Stack,
  Text,
} from "@fluentui/react";
import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";
import * as React from "react";

export interface IUpdateModal {
  onDismiss: () => void;
  isOpen: boolean;
  context: ListViewCommandSetContext;
}

const verticalStackProps = {
  tokens: { childrenGap: 10 },
};

export const UpdateModal: React.FunctionComponent<IUpdateModal> = (props) => {
  const onCancel = () => {
    props.onDismiss();
  };

  const onSave = () => {
    props.onDismiss();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onDismiss={onCancel}
      isBlocking={false}
      containerClassName="containerClassName"
    >
      <Stack {...verticalStackProps}>
        <Text>{/* Your text goes here */}</Text>
        <DialogFooter>
          <DefaultButton text="Cancel" onClick={onCancel} />
          <PrimaryButton text="Save" onClick={onSave} />
        </DialogFooter>
      </Stack>
    </Modal>
  );
};
