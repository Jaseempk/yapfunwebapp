import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  FeeWithdrawalInitiated,
  MarketReset,
  OrderCanceled,
  OrderCreated,
  OrderFilled,
  PositionClosed,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/YapOrderBook/YapOrderBook"

export function createFeeWithdrawalInitiatedEvent(
  caller: Address,
  amountWithdrawn: BigInt
): FeeWithdrawalInitiated {
  let feeWithdrawalInitiatedEvent =
    changetype<FeeWithdrawalInitiated>(newMockEvent())

  feeWithdrawalInitiatedEvent.parameters = new Array()

  feeWithdrawalInitiatedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  feeWithdrawalInitiatedEvent.parameters.push(
    new ethereum.EventParam(
      "amountWithdrawn",
      ethereum.Value.fromUnsignedBigInt(amountWithdrawn)
    )
  )

  return feeWithdrawalInitiatedEvent
}

export function createMarketResetEvent(timestamp: BigInt): MarketReset {
  let marketResetEvent = changetype<MarketReset>(newMockEvent())

  marketResetEvent.parameters = new Array()

  marketResetEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return marketResetEvent
}

export function createOrderCanceledEvent(
  orderId: BigInt,
  order: ethereum.Tuple
): OrderCanceled {
  let orderCanceledEvent = changetype<OrderCanceled>(newMockEvent())

  orderCanceledEvent.parameters = new Array()

  orderCanceledEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  )
  orderCanceledEvent.parameters.push(
    new ethereum.EventParam("order", ethereum.Value.fromTuple(order))
  )

  return orderCanceledEvent
}

export function createOrderCreatedEvent(
  orderId: BigInt,
  trader: Address,
  kolId: BigInt,
  isLong: boolean,
  mindshareValue: BigInt,
  quantity: BigInt
): OrderCreated {
  let orderCreatedEvent = changetype<OrderCreated>(newMockEvent())

  orderCreatedEvent.parameters = new Array()

  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  )
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam("trader", ethereum.Value.fromAddress(trader))
  )
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam("kolId", ethereum.Value.fromUnsignedBigInt(kolId))
  )
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong))
  )
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "mindshareValue",
      ethereum.Value.fromUnsignedBigInt(mindshareValue)
    )
  )
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "quantity",
      ethereum.Value.fromUnsignedBigInt(quantity)
    )
  )

  return orderCreatedEvent
}

export function createOrderFilledEvent(
  orderId: BigInt,
  filledQuantity: BigInt,
  counterpartyTrader: Address
): OrderFilled {
  let orderFilledEvent = changetype<OrderFilled>(newMockEvent())

  orderFilledEvent.parameters = new Array()

  orderFilledEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  )
  orderFilledEvent.parameters.push(
    new ethereum.EventParam(
      "filledQuantity",
      ethereum.Value.fromUnsignedBigInt(filledQuantity)
    )
  )
  orderFilledEvent.parameters.push(
    new ethereum.EventParam(
      "counterpartyTrader",
      ethereum.Value.fromAddress(counterpartyTrader)
    )
  )

  return orderFilledEvent
}

export function createPositionClosedEvent(
  user: Address,
  market: Address,
  pnl: BigInt,
  positionId: BigInt
): PositionClosed {
  let positionClosedEvent = changetype<PositionClosed>(newMockEvent())

  positionClosedEvent.parameters = new Array()

  positionClosedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  positionClosedEvent.parameters.push(
    new ethereum.EventParam("market", ethereum.Value.fromAddress(market))
  )
  positionClosedEvent.parameters.push(
    new ethereum.EventParam("pnl", ethereum.Value.fromSignedBigInt(pnl))
  )
  positionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "positionId",
      ethereum.Value.fromUnsignedBigInt(positionId)
    )
  )

  return positionClosedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}
