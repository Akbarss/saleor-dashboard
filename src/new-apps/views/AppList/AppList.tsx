import { useApolloClient } from "@apollo/client";
import { EXTENSION_LIST_QUERY } from "@saleor/apps/queries";
import {
  AppSortField,
  AppTypeEnum,
  OrderDirection,
  useAppActivateMutation,
  useAppDeactivateMutation,
  useAppDeleteMutation,
  useAppsListQuery,
} from "@saleor/graphql";
import useFetch from "@saleor/hooks/useFetch";
import useListSettings from "@saleor/hooks/useListSettings";
import useLocalPaginator, {
  useLocalPaginationState,
} from "@saleor/hooks/useLocalPaginator";
import useNavigator from "@saleor/hooks/useNavigator";
import useNotifier from "@saleor/hooks/useNotifier";
import { PaginatorContext } from "@saleor/hooks/usePaginator";
import { findById } from "@saleor/misc";
import AppActivateDialog from "@saleor/new-apps/components/AppActivateDialog";
import AppDeactivateDialog from "@saleor/new-apps/components/AppDeactivateDialog";
import AppDeleteDialog from "@saleor/new-apps/components/AppDeleteDialog";
import AppListPage from "@saleor/new-apps/components/AppListPage/AppListPage";
import { AppListContext, AppListContextValues } from "@saleor/new-apps/context";
import { GetV2SaleorAppsResponse } from "@saleor/new-apps/marketplace.types";
import {
  AppListUrlDialog,
  AppListUrlQueryParams,
  AppUrls,
} from "@saleor/new-apps/urls";
import {
  getComingSoonMarketplaceApps,
  getInstallableMarketplaceApps,
} from "@saleor/new-apps/utils";
import { ListViews } from "@saleor/types";
import createDialogActionHandlers from "@saleor/utils/handlers/dialogActionHandlers";
import { mapEdgesToItems } from "@saleor/utils/maps";
import React from "react";
import { useIntl } from "react-intl";

import { messages } from "./messages";

interface AppsListProps {
  params: AppListUrlQueryParams;
}

export const AppsList: React.FC<AppsListProps> = ({ params }) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();
  const client = useApolloClient();
  const [openModal, closeModal] = createDialogActionHandlers<
    AppListUrlDialog,
    AppListUrlQueryParams
  >(navigate, AppUrls.resolveAppListUrl, params);

  const { updateListSettings, settings } = useListSettings(ListViews.APPS_LIST);
  const queryVariables = {
    sort: {
      direction: OrderDirection.DESC,
      field: AppSortField.CREATION_DATE,
    },
  };

  const [paginationState, setPaginationState] = useLocalPaginationState(
    settings?.rowNumber,
  );
  const paginate = useLocalPaginator(setPaginationState);

  const { data: installedAppsData, loading, refetch } = useAppsListQuery({
    displayLoader: true,
    variables: {
      ...paginationState,
      ...queryVariables,
      filter: {
        type: AppTypeEnum.THIRDPARTY,
      },
    },
  });
  const { pageInfo, ...paginationValues } = paginate(
    installedAppsData?.apps.pageInfo,
    paginationState,
  );

  const refetchExtensionList = () => {
    client.refetchQueries({
      include: [EXTENSION_LIST_QUERY],
    });
  };

  const handleRemoveConfirm = () =>
    deleteApp({
      variables: {
        id: params.id,
      },
    });

  const removeAppNotify = () => {
    notify({
      status: "success",
      text: intl.formatMessage(messages.appRemoved),
    });
  };

  const handleActivateAppConfirm = () =>
    activateApp({ variables: { id: params.id } });

  const handleDeactivateAppConfirm = () =>
    deactivateApp({ variables: { id: params.id } });

  const [deleteApp, deleteAppOpts] = useAppDeleteMutation({
    onCompleted: data => {
      if (!data?.appDelete?.errors?.length) {
        refetch();
        closeModal();
        refetchExtensionList();
        removeAppNotify();
      }
    },
  });
  const [activateApp, activateAppResult] = useAppActivateMutation({
    onCompleted: data => {
      if (!data?.appActivate?.errors?.length) {
        notify({
          status: "success",
          text: intl.formatMessage(messages.appActivated),
        });
        refetch();
        closeModal();
      }
    },
  });
  const [deactivateApp, deactivateAppResult] = useAppDeactivateMutation({
    onCompleted: data => {
      if (!data?.appDeactivate?.errors?.length) {
        notify({
          status: "success",
          text: intl.formatMessage(messages.appDeactivated),
        });
        refetch();
        closeModal();
      }
    },
  });

  const context: AppListContextValues = React.useMemo(
    () => ({
      activateApp: id => openModal("app-activate", { id }),
      deactivateApp: id => openModal("app-deactivate", { id }),
    }),
    [activateApp, deactivateApp],
  );

  const { data: marketplaceAppList } = useFetch<
    GetV2SaleorAppsResponse.SaleorApp[]
  >(
    "https://marketplace-gray.vercel.app/api/v2/saleor-apps?saleor-url=https://master.staging.saleor.cloud/",
  );

  const installableMarketplaceApps = getInstallableMarketplaceApps(
    marketplaceAppList,
  );
  const comingSoonMarketplaceApps = getComingSoonMarketplaceApps(
    marketplaceAppList,
  );
  const installedApps = mapEdgesToItems(installedAppsData?.apps);
  const currentAppName = findById(params.id, installedApps)?.name;

  return (
    <AppListContext.Provider value={context}>
      <PaginatorContext.Provider value={{ ...pageInfo, ...paginationValues }}>
        <AppDeleteDialog
          confirmButtonState={deleteAppOpts.status}
          name={currentAppName}
          onClose={closeModal}
          onConfirm={handleRemoveConfirm}
          type="EXTERNAL"
          open={params.action === "remove-app"}
        />
        <AppActivateDialog
          confirmButtonState={activateAppResult.status}
          name={currentAppName}
          onClose={closeModal}
          onConfirm={handleActivateAppConfirm}
          open={params.action === "app-activate"}
        />
        <AppDeactivateDialog
          confirmButtonState={deactivateAppResult.status}
          name={currentAppName}
          onClose={closeModal}
          onConfirm={handleDeactivateAppConfirm}
          open={params.action === "app-deactivate"}
        />
        <AppListPage
          installedApps={installedApps}
          installableMarketplaceApps={installableMarketplaceApps}
          comingSoonMarketplaceApps={comingSoonMarketplaceApps}
          disabled={loading}
          settings={settings}
          onUpdateListSettings={updateListSettings}
          onInstalledAppRemove={id =>
            openModal("remove-app", {
              id,
            })
          }
        />
      </PaginatorContext.Provider>
    </AppListContext.Provider>
  );
};
export default AppsList;
