import {
  OrderFulFilled as OrderFulFilledEvent,
  PnLSettled as PnLSettledEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  UserBalanceLocked as UserBalanceLockedEvent,
  UserBalanceUnlocked as UserBalanceUnlockedEvent,
  UserDepositWithdrawn as UserDepositWithdrawnEvent,
  UserFundDeposited as UserFundDepositedEvent
} from "../generated/YapEscrow/YapEscrow"
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
} from "../generated/schema"

export function handleOrderFulFilled(event: OrderFulFilledEvent): void {
  let entity = new OrderFulFilled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketAddy = event.params.marketAddy
  entity.makerOrTakerAddy = event.params.makerOrTakerAddy
  entity.amountFilled = event.params.amountFilled

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePnLSettled(event: PnLSettledEvent): void {
  let entity = new PnLSettled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.market = event.params.market
  entity.settlingAmount = event.params.settlingAmount

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

export function handleUserBalanceLocked(event: UserBalanceLockedEvent): void {
  let entity = new UserBalanceLocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.userAddy = event.params.userAddy
  entity.marketAddy = event.params.marketAddy
  entity.amountToLock = event.params.amountToLock

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUserBalanceUnlocked(
  event: UserBalanceUnlockedEvent
): void {
  let entity = new UserBalanceUnlocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.marketAddy = event.params.marketAddy
  entity.balanceToFill = event.params.balanceToFill

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUserDepositWithdrawn(
  event: UserDepositWithdrawnEvent
): void {
  let entity = new UserDepositWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.withdrawalAmount = event.params.withdrawalAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUserFundDeposited(event: UserFundDepositedEvent): void {
  let entity = new UserFundDeposited(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.depositAmount = event.params.depositAmount
  entity.userBalance = event.params.userBalance
  entity.timeStamp = event.params.timeStamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
