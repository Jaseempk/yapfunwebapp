import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  OrderFulFilled,
  PnLSettled,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  UserBalanceLocked,
  UserBalanceUnlocked,
  UserDepositWithdrawn,
  UserFundDeposited
} from "../generated/YapEscrow/YapEscrow"

export function createOrderFulFilledEvent(
  marketAddy: Address,
  makerOrTakerAddy: Address,
  amountFilled: BigInt
): OrderFulFilled {
  let orderFulFilledEvent = changetype<OrderFulFilled>(newMockEvent())

  orderFulFilledEvent.parameters = new Array()

  orderFulFilledEvent.parameters.push(
    new ethereum.EventParam(
      "marketAddy",
      ethereum.Value.fromAddress(marketAddy)
    )
  )
  orderFulFilledEvent.parameters.push(
    new ethereum.EventParam(
      "makerOrTakerAddy",
      ethereum.Value.fromAddress(makerOrTakerAddy)
    )
  )
  orderFulFilledEvent.parameters.push(
    new ethereum.EventParam(
      "amountFilled",
      ethereum.Value.fromUnsignedBigInt(amountFilled)
    )
  )

  return orderFulFilledEvent
}

export function createPnLSettledEvent(
  user: Address,
  market: Address,
  settlingAmount: BigInt
): PnLSettled {
  let pnLSettledEvent = changetype<PnLSettled>(newMockEvent())

  pnLSettledEvent.parameters = new Array()

  pnLSettledEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  pnLSettledEvent.parameters.push(
    new ethereum.EventParam("market", ethereum.Value.fromAddress(market))
  )
  pnLSettledEvent.parameters.push(
    new ethereum.EventParam(
      "settlingAmount",
      ethereum.Value.fromUnsignedBigInt(settlingAmount)
    )
  )

  return pnLSettledEvent
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

export function createUserBalanceLockedEvent(
  userAddy: Address,
  marketAddy: Address,
  amountToLock: BigInt
): UserBalanceLocked {
  let userBalanceLockedEvent = changetype<UserBalanceLocked>(newMockEvent())

  userBalanceLockedEvent.parameters = new Array()

  userBalanceLockedEvent.parameters.push(
    new ethereum.EventParam("userAddy", ethereum.Value.fromAddress(userAddy))
  )
  userBalanceLockedEvent.parameters.push(
    new ethereum.EventParam(
      "marketAddy",
      ethereum.Value.fromAddress(marketAddy)
    )
  )
  userBalanceLockedEvent.parameters.push(
    new ethereum.EventParam(
      "amountToLock",
      ethereum.Value.fromUnsignedBigInt(amountToLock)
    )
  )

  return userBalanceLockedEvent
}

export function createUserBalanceUnlockedEvent(
  user: Address,
  marketAddy: Address,
  balanceToFill: BigInt
): UserBalanceUnlocked {
  let userBalanceUnlockedEvent = changetype<UserBalanceUnlocked>(newMockEvent())

  userBalanceUnlockedEvent.parameters = new Array()

  userBalanceUnlockedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  userBalanceUnlockedEvent.parameters.push(
    new ethereum.EventParam(
      "marketAddy",
      ethereum.Value.fromAddress(marketAddy)
    )
  )
  userBalanceUnlockedEvent.parameters.push(
    new ethereum.EventParam(
      "balanceToFill",
      ethereum.Value.fromUnsignedBigInt(balanceToFill)
    )
  )

  return userBalanceUnlockedEvent
}

export function createUserDepositWithdrawnEvent(
  user: Address,
  withdrawalAmount: BigInt
): UserDepositWithdrawn {
  let userDepositWithdrawnEvent =
    changetype<UserDepositWithdrawn>(newMockEvent())

  userDepositWithdrawnEvent.parameters = new Array()

  userDepositWithdrawnEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  userDepositWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "withdrawalAmount",
      ethereum.Value.fromUnsignedBigInt(withdrawalAmount)
    )
  )

  return userDepositWithdrawnEvent
}

export function createUserFundDepositedEvent(
  user: Address,
  depositAmount: BigInt,
  userBalance: BigInt,
  timeStamp: BigInt
): UserFundDeposited {
  let userFundDepositedEvent = changetype<UserFundDeposited>(newMockEvent())

  userFundDepositedEvent.parameters = new Array()

  userFundDepositedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  userFundDepositedEvent.parameters.push(
    new ethereum.EventParam(
      "depositAmount",
      ethereum.Value.fromUnsignedBigInt(depositAmount)
    )
  )
  userFundDepositedEvent.parameters.push(
    new ethereum.EventParam(
      "userBalance",
      ethereum.Value.fromUnsignedBigInt(userBalance)
    )
  )
  userFundDepositedEvent.parameters.push(
    new ethereum.EventParam(
      "timeStamp",
      ethereum.Value.fromUnsignedBigInt(timeStamp)
    )
  )

  return userFundDepositedEvent
}
