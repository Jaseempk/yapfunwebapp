import {
  FeeWithdrawalInitiated as FeeWithdrawalInitiatedEvent,
  MarketReset as MarketResetEvent,
  OrderCanceled as OrderCanceledEvent,
  OrderCreated as OrderCreatedEvent,
  OrderFilled as OrderFilledEvent,
  PositionClosed as PositionClosedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
} from "../generated/templates/YapOrderBook/YapOrderBook";
import {
  FeeWithdrawalInitiated,
  MarketReset,
  OrderCanceled,
  OrderCreated,
  OrderFilled,
  PositionClosed,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
} from "../generated/schema";

export function handleFeeWithdrawalInitiated(
  event: FeeWithdrawalInitiatedEvent
): void {
  let entity = new FeeWithdrawalInitiated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.caller = event.params.caller;
  entity.amountWithdrawn = event.params.amountWithdrawn;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMarketReset(event: MarketResetEvent): void {
  let entity = new MarketReset(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.timestamp = event.params.timestamp;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOrderCanceled(event: OrderCanceledEvent): void {
  let entity = new OrderCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.orderId = event.params.orderId;
  entity.order_trader = event.params.order.trader;
  entity.order_positionId = event.params.order.positionId;
  entity.order_kolId = event.params.order.kolId;
  entity.order_isLong = event.params.order.isLong;
  entity.order_mindshareValue = event.params.order.mindshareValue;
  entity.order_quantity = event.params.order.quantity;
  entity.order_filledQuantity = event.params.order.filledQuantity;
  entity.order_timestamp = event.params.order.timestamp;
  entity.order_status = event.params.order.status;
  entity.cancelAmount = event.params.cancelAmount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOrderCreated(event: OrderCreatedEvent): void {
  let entity = new OrderCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.orderId = event.params.orderId;
  entity.trader = event.params.trader;
  entity.kolId = event.params.kolId;
  entity.market = event.params.market;
  entity.isLong = event.params.isLong;
  entity.mindshareValue = event.params.mindshareValue;
  entity.quantity = event.params.quantity;
  entity._totalVolume = event.params._totalVolume;
  entity.activeOrderCount = event.params.activeOrderCount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOrderFilled(event: OrderFilledEvent): void {
  let entity = new OrderFilled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.orderId = event.params.orderId;
  entity.filledQuantity = event.params.filledQuantity;
  entity.counterpartyTrader = event.params.counterpartyTrader;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePositionClosed(event: PositionClosedEvent): void {
  let entity = new PositionClosed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.market = event.params.market;
  entity.pnl = event.params.pnl;
  entity.positionId = event.params.positionId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.role = event.params.role;
  entity.previousAdminRole = event.params.previousAdminRole;
  entity.newAdminRole = event.params.newAdminRole;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.role = event.params.role;
  entity.account = event.params.account;
  entity.sender = event.params.sender;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.role = event.params.role;
  entity.account = event.params.account;
  entity.sender = event.params.sender;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
