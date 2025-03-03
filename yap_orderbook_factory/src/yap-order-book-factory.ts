import {
  NewMarketInitialisedAndWhitelisted as NewMarketInitialisedAndWhitelistedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
} from "../generated/YapOrderBookFactory/YapOrderBookFactory";
import {
  NewMarketInitialisedAndWhitelisted,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
} from "../generated/schema";

// import { YapOrderBook } from "../generated/templates";

export function handleNewMarketInitialisedAndWhitelisted(
  event: NewMarketInitialisedAndWhitelistedEvent
): void {
  let entity = new NewMarketInitialisedAndWhitelisted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.kolId = event.params.kolId;
  entity.maker = event.params.maker;
  entity.marketAddy = event.params.marketAddy;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  // YapOrderBook.create(event.params.marketAddy);
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
