import { AppsConfig } from "@saleor/config";
import { IntlShape } from "react-intl";

import { GetV2SaleorAppsResponse } from "./marketplace.types";
import { messages } from "./messages";
import { AppLink } from "./types";

export const getInstallableMarketplaceApps = (
  marketplaceAppList: GetV2SaleorAppsResponse.SaleorApp[],
) =>
  marketplaceAppList?.filter(
    app => "manifestUrl" in app || "vercelDeploymentUrl" in app,
  ) as GetV2SaleorAppsResponse.ReleasedSaleorApp[] | undefined;

export const getComingSoonMarketplaceApps = (
  marketplaceAppList: GetV2SaleorAppsResponse.SaleorApp[],
) =>
  marketplaceAppList?.filter(
    app =>
      !("manifestUrl" in app) &&
      !("vercelDeploymentUrl" in app) &&
      "releaseDate" in app,
  ) as GetV2SaleorAppsResponse.ComingSoonSaleorApp[] | undefined;

export const isAppInTunnel = (manifestUrl: string) =>
  Boolean(
    AppsConfig.tunnelUrlKeywords.find(keyword =>
      new URL(manifestUrl).host.includes(keyword),
    ),
  );

const prepareAppLinks = (
  intl: IntlShape,
  app: GetV2SaleorAppsResponse.ReleasedSaleorApp,
): AppLink[] => [
  {
    name: intl.formatMessage(messages.repository),
    url: app.repositoryUrl,
  },
  {
    name: intl.formatMessage(messages.support),
    url: app.supportUrl,
  },
  {
    name: intl.formatMessage(messages.dataPrivacy),
    url: app.privacyUrl,
  },
];

export const getAppDetails = (
  intl: IntlShape,
  app: GetV2SaleorAppsResponse.SaleorApp,
  navigateToAppInstallPage?: (url: string) => void,
  navigateToVercelDeploymentPage?: (url: string) => void,
) => {
  const isAppComingSoon =
    !("manifestUrl" in app) &&
    !("vercelDeploymentUrl" in app) &&
    "releaseDate" in app;
  const isAppInstallable = "manifestUrl" in app && !!navigateToAppInstallPage;
  const isAppVercelDeployable =
    "vercelDeploymentUrl" in app && !!navigateToVercelDeploymentPage;

  return {
    releaseDate: isAppComingSoon ? app.releaseDate : undefined,
    installHandler: isAppInstallable
      ? () => navigateToAppInstallPage(app.manifestUrl)
      : undefined,
    vercelDeployHandler: isAppVercelDeployable
      ? () => navigateToVercelDeploymentPage(app.vercelDeploymentUrl)
      : undefined,
    links: isAppComingSoon ? [] : prepareAppLinks(intl, app),
  };
};
