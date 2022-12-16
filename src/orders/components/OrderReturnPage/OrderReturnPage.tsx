import { Backlink } from "@saleor/components/Backlink";
import CardSpacer from "@saleor/components/CardSpacer";
import Container from "@saleor/components/Container";
import Grid from "@saleor/components/Grid";
import PageHeader from "@saleor/components/PageHeader";
import { OrderDetailsFragment, OrderErrorFragment } from "@saleor/graphql";
import { SubmitPromise } from "@saleor/hooks/useForm";
import { Button } from "@saleor/macaw-ui";
import { renderCollection } from "@saleor/misc";
import { orderUrl } from "@saleor/orders/urls";
import React from "react";
import { useIntl } from "react-intl";

import { ItemsCard } from "./components";
import OrderRefundForm, { OrderRefundSubmitData } from "./form";
import { orderReturnMessages } from "./messages";
import {
  getFulfilledFulfillemnts,
  getParsedLines,
  getUnfulfilledLines,
  getWaitingFulfillments,
} from "./utils";

export interface OrderReturnPageProps {
  order: OrderDetailsFragment;
  loading: boolean;
  errors?: OrderErrorFragment[];
  onSubmit: (data: OrderRefundSubmitData) => SubmitPromise;
}

const OrderRefundPage: React.FC<OrderReturnPageProps> = props => {
  const { order, loading, errors = [], onSubmit } = props;

  const intl = useIntl();
  return (
    <OrderRefundForm order={order} onSubmit={onSubmit}>
      {({ data, handlers, /* change,*/ submit, isSaveDisabled }) => (
        <Container>
          <Backlink href={orderUrl(order?.id)}>
            {intl.formatMessage(orderReturnMessages.appTitle, {
              orderNumber: order?.number,
            })}
          </Backlink>
          <PageHeader
            title={intl.formatMessage(orderReturnMessages.pageTitle, {
              orderNumber: order?.number,
            })}
          />
          <Grid>
            <div>
              {!!data.unfulfilledItemsQuantities.length && (
                <>
                  <ItemsCard
                    errors={errors}
                    order={order}
                    lines={getUnfulfilledLines(order)}
                    itemsQuantities={data.unfulfilledItemsQuantities}
                    itemsSelections={data.itemsToBeReplaced}
                    onChangeQuantity={handlers.changeUnfulfiledItemsQuantity}
                    onSetMaxQuantity={
                      handlers.handleSetMaximalUnfulfiledItemsQuantities
                    }
                    onChangeSelected={handlers.changeItemsToBeReplaced}
                  />
                  <CardSpacer />
                </>
              )}
              {renderCollection(
                getWaitingFulfillments(order),
                ({ id, lines }) => (
                  <React.Fragment key={id}>
                    <ItemsCard
                      errors={errors}
                      order={order}
                      fulfilmentId={id}
                      lines={getParsedLines(lines)}
                      itemsQuantities={data.waitingItemsQuantities}
                      itemsSelections={data.itemsToBeReplaced}
                      onChangeQuantity={handlers.changeWaitingItemsQuantity}
                      onSetMaxQuantity={handlers.handleSetMaximalItemsQuantities(
                        id,
                      )}
                      onChangeSelected={handlers.changeItemsToBeReplaced}
                    />
                    <CardSpacer />
                  </React.Fragment>
                ),
              )}
              {renderCollection(
                getFulfilledFulfillemnts(order),
                ({ id, lines }) => (
                  <React.Fragment key={id}>
                    <ItemsCard
                      errors={errors}
                      order={order}
                      fulfilmentId={id}
                      lines={getParsedLines(lines)}
                      itemsQuantities={data.fulfilledItemsQuantities}
                      itemsSelections={data.itemsToBeReplaced}
                      onChangeQuantity={handlers.changeFulfiledItemsQuantity}
                      onSetMaxQuantity={handlers.handleSetMaximalItemsQuantities(
                        id,
                      )}
                      onChangeSelected={handlers.changeItemsToBeReplaced}
                    />
                    <CardSpacer />
                  </React.Fragment>
                ),
              )}
            </div>
            <div>
              {/* TODO */}
              <Button disabled={isSaveDisabled || loading} onClick={submit}>
                Submit
              </Button>
            </div>
          </Grid>
        </Container>
      )}
    </OrderRefundForm>
  );
};

export default OrderRefundPage;
