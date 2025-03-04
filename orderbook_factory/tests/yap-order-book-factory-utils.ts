import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  NewMarketInitialisedAndWhitelisted,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/YapOrderBookFactory/YapOrderBookFactory"

export function createNewMarketInitialisedAndWhitelistedEvent(
  kolId: BigInt,
  maker: Address,
  marketAddy: Address
): NewMarketInitialisedAndWhitelisted {
  let newMarketInitialisedAndWhitelistedEvent =
    changetype<NewMarketInitialisedAndWhitelisted>(newMockEvent())

  newMarketInitialisedAndWhitelistedEvent.parameters = new Array()

  newMarketInitialisedAndWhitelistedEvent.parameters.push(
    new ethereum.EventParam("kolId", ethereum.Value.fromUnsignedBigInt(kolId))
  )
  newMarketInitialisedAndWhitelistedEvent.parameters.push(
    new ethereum.EventParam("maker", ethereum.Value.fromAddress(maker))
  )
  newMarketInitialisedAndWhitelistedEvent.parameters.push(
    new ethereum.EventParam(
      "marketAddy",
      ethereum.Value.fromAddress(marketAddy)
    )
  )

  return newMarketInitialisedAndWhitelistedEvent
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
