'use strict';

var Card = aReq('server/game/cards/card'),
    events = aReq('server/game/events'),
    misc = aReq('server/misc'),
    healing = aReq('server/game/cards/healing'),
    Beer = healing.Beer;

var handleEvent = (eventName, players, recurseArgs, onFollowing, onResolved) => {
    let handlers = [];
    players.forEach(p => handlers.push.apply(handlers, p.handlers(eventName)));

    let handlePile = () => {
        let next = handlers.pop();
        if (next) next[eventName].apply(next, recurseArgs);
        else if(onFollowing) onFollowing.apply(null, recurseArgs);
        else onResolved();
    }
    recurseArgs.push(
        // onResolved
        event => event ? onResolved(event) : handlePile(),
        // onSkip
        onResolved
    );
    handlePile();
};

var handleAfterDeath = (step, killer, player, amount, onResolved) =>
handleEvent('afterDeath',
    step.game.players.filter(p => p.alive || p === player),
    [step, killer, player, amount],
    () => {
        if (player === step.player) step.phase.goToNextTurn(step.game);
        else onResolved();
        step.phase.checkForEnd(step.game);
    },
    onResolved
);
var handleBeforeDeath = (step, killer, player, amount, onResolved) =>
handleEvent('beforeDeath',
    step.game.players.filter(p => p.alive || p === player),
    [step, killer, player, amount],
    () => {
        player.hand.discard();
        player.equipped.discard();

        step.game.onGameEvent({ name: 'dead', player: player.name });

        handleAfterDeath(step, killer, player, amount, onResolved);
    },
    onResolved
);

var handleDying = (step, killer, player, amount, onResolved) => {
    if (player.alive) {
        handleEvent('afterDamage',
            step.game.players.filter(p => p.alive),
            [step, killer, player, amount],
            undefined, onResolved
        );
        return;
    }

    onResolved(events('cardType', player, step)(
        player, Beer,
        // When a beer is played, we check if we are dying again
        // (we override the onResolved so that events are still properly handled)
        card => card.handlePlay(step, event => event ?
            onResolved(event) :
            handleDying(step, killer, player, amount, onResolved)
        ),
        // Player didn't drink beer; they are dead
        () => handleBeforeDeath(step, killer, player, amount, onResolved),
        // Format
        () => ({
            name: 'dying',
            player: player.name,
            killer: killer ? killer.name : undefined
        })
    ));
};
var handleDamage = (step, source, target, amount, onResolved) => {
    target.life -= amount;
    step.game.onGameEvent({
        name: 'damage',
        source: source ? source.name : undefined,
        target: target.name,
        amount: amount
    });
    if (target.dead) handleDying(step, source, target, amount, onResolved);
    else handleEvent('afterDamage',
        step.game.players.filter(p => p.alive),
        [step, source, target, amount],
        undefined, onResolved
    );
};

var handleAttackAvoid = (
    name, step, card, target, avoidCards, avoid, avoidCardType, onResolved
) => {
    if (avoidCards.length >= avoid) {
        avoidCards.forEach(card => target.hand.discard(card.id));
        step.game.onGameEvent({
            name: 'avoid',
            for: name,
            source: step.player.name,
            target: target.name,
            cards: avoidCards.map(c => c.format())
        });
        onResolved();
    } else {
        onResolved(events('cardType')(
            target, avoidCardType,
            // onCard; consider the card for the avoiding
            avoidCard => {
                avoidCards.push(avoidCard);
                handleAttackAvoid(name, step, card, target, avoidCards, avoid, avoidCardType, onResolved);
            },
            // onCancel; the damage goes through
            () => handleDamage(step, step.player, target, 1, onResolved),
            // format
            () => ({
                for: name,
                source: step.player.name,
                target: target.name,
                card: card.format()
            })
        ).filterCards(card => avoidCards.indexOf(card) === -1));
    }
};

var handleAttack = (name, step, card, target, avoidCardType, onResolved) =>
handleEvent('before' + name + 'Response',
    step.game.players.filter(p => p.alive),
    [step, card, target, {
        avoid: 0,
        required: step.player.stat(name.toLowerCase() + 'Avoid')
    }],
    // onFollowing
    (step, card, target, attack) => handleAttackAvoid(name, step, card, target,
        [], attack.required - attack.avoid,
        avoidCardType,
        onResolved
    ),
    onResolved
);

module.exports = {
    event: handleEvent,
    beforeDeath: handleBeforeDeath,
    afterDeath: handleAfterDeath,
    dying: handleDying,
    damage: handleDamage,
    attack: handleAttack
};