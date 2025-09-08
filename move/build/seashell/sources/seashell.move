module seashell::seashell;

use std::{string::String , string::utf8};
use sui::{clock::Clock, coin::Coin, dynamic_field as df, sui::SUI, dynamic_object_field as dof, display, package};
use seashell::utils::is_prefix;

//const ENotOwner: u64 = 1;
const EInvalidFee: u64 = 1;
const ENoAccess: u64 = 2;

// Shared Object to keep track of all creators
public struct CreatorRegistry has key {
    id: UID
}

// Creator object contains info about the creator and the list of content blob-ids
public struct Creator has key, store {
    id: UID,
    creator_address: address,
    creator_name: String,
    creator_description: String,
    creator_image_url: String,
    subscription_fee: u64,
    subscription_period: u64,
}

public struct Subscription has key {
    id: UID,
    creator_address: address,
    created_at: u64,
    creator_name: String,
    creator_description: String,
    creator_image_url: String,
}

public struct SEASHELL has drop {}

fun init(otw: SEASHELL, ctx: &mut TxContext) {
        let keys = vector[
            utf8(b"name"),
            utf8(b"image_url"),
            utf8(b"description"),
        ];

        let values = vector[
            utf8(b"{creator_name}"),
            utf8(b"{creator_image_url}"),
            utf8(b"{creator_description}"),
        ];
        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<Subscription>(
            &publisher, keys, values, ctx
        );
        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));

        transfer::transfer(
            CreatorRegistry {
                id: object::new(ctx),
            },
            tx_context::sender(ctx),
        );

}

public fun create_creator(
    creatorRegistry: &mut CreatorRegistry,
    creator_name: String,
    creator_description: String,
    creator_image_url: String,
    subscription_fee: u64,
    subscription_period: u64,
    ctx: &mut TxContext,
) {
    let creator = Creator {
        id: object::new(ctx),
        creator_address: ctx.sender(),
        creator_name: creator_name,
        creator_description: creator_description,
        creator_image_url: creator_image_url,
        subscription_fee: subscription_fee,
        subscription_period: subscription_period,
    };
    dof::add<address, Creator>(&mut creatorRegistry.id, ctx.sender(), creator);
}

/// Encapsulate a blob into a Sui object and attach it to the Creator
public fun creator_add_content(
    creatorRegistry: &mut CreatorRegistry,
    blob_id: String,
    ctx: &mut TxContext,
) {
    let creator = dof::borrow_mut<address, Creator>(&mut creatorRegistry.id, ctx.sender());
    df::add(&mut creator.id, blob_id, 0);
}

public fun subscribe_to_creator(
    creatorRegistry: &mut CreatorRegistry,
    creator_address: address,
    fee: Coin<SUI>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let creator = dof::borrow_mut<address, Creator>(&mut creatorRegistry.id, creator_address);
    assert!(fee.value() == creator.subscription_fee, EInvalidFee);

    transfer::public_transfer(fee, creator.creator_address);

   let subscription = Subscription {
        id: object::new(ctx),
        creator_address: creator_address,
        created_at: c.timestamp_ms(),
        creator_name: creator.creator_name,
        creator_description: creator.creator_description,
        creator_image_url: creator.creator_image_url,
    };

    transfer::transfer(subscription, ctx.sender());
}

//////////////////////////////////////////////////////////
/// Access control
/// key format: [pkg id]::[creator address][random nonce]

/// All users holding a subscription object with the creator address can access the content
fun approve_internal(id: vector<u8>, subscription: &Subscription, creatorRegistry: &CreatorRegistry, creator_address: address, clock: &Clock): bool {
    let creator = dof::borrow<address, Creator>(&creatorRegistry.id, creator_address);
    
    if (creator.creator_address != subscription.creator_address) {
        return false
    };
  
    if (clock.timestamp_ms() > subscription.created_at + creator.subscription_period) {
        return false
    };

    // Check if the id has the right prefix
    is_prefix(creator_address.to_bytes(), id)
}

entry fun seal_approve(id: vector<u8>, subscription: &Subscription, creatorRegistry: &CreatorRegistry, creator_address: address, clock: &Clock) {
    assert!(approve_internal(id, subscription, creatorRegistry, creator_address, clock), ENoAccess);
}
