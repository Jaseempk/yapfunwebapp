import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { NewMarketInitialisedAndWhitelisted } from "../generated/schema"
import { NewMarketInitialisedAndWhitelisted as NewMarketInitialisedAndWhitelistedEvent } from "../generated/YapOrderBookFactory/YapOrderBookFactory"
import { handleNewMarketInitialisedAndWhitelisted } from "../src/yap-order-book-factory"
import { createNewMarketInitialisedAndWhitelistedEvent } from "./yap-order-book-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let kolId = BigInt.fromI32(234)
    let maker = Address.fromString("0x0000000000000000000000000000000000000001")
    let marketAddy = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newNewMarketInitialisedAndWhitelistedEvent =
      createNewMarketInitialisedAndWhitelistedEvent(kolId, maker, marketAddy)
    handleNewMarketInitialisedAndWhitelisted(
      newNewMarketInitialisedAndWhitelistedEvent
    )
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("NewMarketInitialisedAndWhitelisted created and stored", () => {
    assert.entityCount("NewMarketInitialisedAndWhitelisted", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "NewMarketInitialisedAndWhitelisted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "kolId",
      "234"
    )
    assert.fieldEquals(
      "NewMarketInitialisedAndWhitelisted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "maker",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "NewMarketInitialisedAndWhitelisted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "marketAddy",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
