import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Bytes, Address } from "@graphprotocol/graph-ts"
import {
  CrashedOutKolDataUpdated,
  KOLDataUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/YapOracle/YapOracle"

export function createCrashedOutKolDataUpdatedEvent(
  kolId: BigInt,
  rank: BigInt,
  mindshareScore: BigInt,
  timestamp: BigInt
): CrashedOutKolDataUpdated {
  let crashedOutKolDataUpdatedEvent =
    changetype<CrashedOutKolDataUpdated>(newMockEvent())

  crashedOutKolDataUpdatedEvent.parameters = new Array()

  crashedOutKolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam("kolId", ethereum.Value.fromUnsignedBigInt(kolId))
  )
  crashedOutKolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam("rank", ethereum.Value.fromUnsignedBigInt(rank))
  )
  crashedOutKolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "mindshareScore",
      ethereum.Value.fromUnsignedBigInt(mindshareScore)
    )
  )
  crashedOutKolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return crashedOutKolDataUpdatedEvent
}

export function createKOLDataUpdatedEvent(
  kolId: BigInt,
  rank: BigInt,
  mindshareScore: BigInt,
  timestamp: BigInt
): KOLDataUpdated {
  let kolDataUpdatedEvent = changetype<KOLDataUpdated>(newMockEvent())

  kolDataUpdatedEvent.parameters = new Array()

  kolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam("kolId", ethereum.Value.fromUnsignedBigInt(kolId))
  )
  kolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam("rank", ethereum.Value.fromUnsignedBigInt(rank))
  )
  kolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "mindshareScore",
      ethereum.Value.fromUnsignedBigInt(mindshareScore)
    )
  )
  kolDataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return kolDataUpdatedEvent
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
