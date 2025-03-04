import {
  CrashedOutKolDataUpdated as CrashedOutKolDataUpdatedEvent,
  KOLDataUpdated as KOLDataUpdatedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent
} from "../generated/YapOracle/YapOracle"
import {
  CrashedOutKolDataUpdated,
  KOLDataUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/schema"

export function handleCrashedOutKolDataUpdated(
  event: CrashedOutKolDataUpdatedEvent
): void {
  let entity = new CrashedOutKolDataUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.kolId = event.params.kolId
  entity.rank = event.params.rank
  entity.mindshareScore = event.params.mindshareScore
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleKOLDataUpdated(event: KOLDataUpdatedEvent): void {
  let entity = new KOLDataUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.kolId = event.params.kolId
  entity.rank = event.params.rank
  entity.mindshareScore = event.params.mindshareScore
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
