import { useState } from "react";
import { t } from "ttag";

import { useUpdateSettingsMutation } from "metabase/api";
import { Button, Group, List, Modal, type ModalProps, Text } from "metabase/ui";

export const EmbeddingSdkLegaleseModal = ({ opened, onClose }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const [updateSettings] = useUpdateSettingsMutation();

  const onAccept = async () => {
    setLoading(true);
    await updateSettings({
      "show-sdk-embed-terms": false,
      "enable-embedding-sdk": true,
    });
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      title={t`First, some legalese`}
      onClose={onClose}
      opened={opened}
      size={670}
      padding="xl"
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <Text mt="xs">
        {t`When using the Embedded analytics SDK for React, each end user should have their own Metabase account.`}
      </Text>
      <List mt="xs">
        <List.Item mr="md">
          <Text>{t`Sharing Metabase accounts is a security risk. Even if you filter data on the client side, each user could use their token to view any data visible to that shared user account.`}</Text>
        </List.Item>
        <List.Item mr="md">
          <Text>{t`That, and we consider shared accounts to be unfair usage. Fair usage of the SDK involves giving each end-user of the embedded analytics their own Metabase account.`}</Text>
        </List.Item>
      </List>
      <Group justify="right" mt="lg">
        <Button
          onClick={onClose}
          variant="outline"
          disabled={loading}
        >{t`Decline and go back`}</Button>
        <Button
          onClick={onAccept}
          variant="filled"
          data-is-loading={loading}
          loading={loading}
        >{t`Agree and continue`}</Button>
      </Group>
    </Modal>
  );
};
