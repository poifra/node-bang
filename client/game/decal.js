var ui = require('../ui'),
    misc = require('../misc');

function Decal() {
    this.tagRoot = ui.create('div');

    this.tagEvent = ui.create('div', 'event', this.tagRoot);
    this.eventPlayerName = ui.create('div', 'player', this.tagEvent);
    this.eventReason = ui.create('div', 'reason', this.tagEvent);
    this.eventType = ui.create('div', 'type', this.tagEvent);
}
Decal.depth = 1;
Decal.prototype = {
    constructor: Decal,

    setInfo: function(game) {
        if (!game.turn) return;
        if (!game.turn.step) return;
        if (!game.turn.step.event) return;

        let event = game.turn.step.event;

        this.eventPlayerName.innerHTML = (event.player instanceof Array) ?
            event.player.reduce((str, name) => str += '<br/>' + name, '') :
            event.player;

        let name = event.name;
        if (
            name === 'CardsDrawEvent' ||
            name === 'CardDrawEvent'
        ) {
            this.eventType.className = 'type draw';
            this.eventType.innerHTML = '';
        }
        else if (
            name === 'CardChoiceEvent' ||
            name === 'CardTypeEvent'
        ) {
            this.eventType.className = 'type choice';
            this.eventType.innerHTML = '';
        }
        else if (
            name === 'TargetRangeEvent' ||
            name === 'TargetOthersEvent' ||
            name === 'TargetEvent'
        ) {
            this.eventType.className = 'type target';
            this.eventType.innerHTML = '';
        }
        else {
            this.eventType.className = 'type';
            this.eventType.innerHTML = misc.spacize(name);
        }

        if (event.for) ui.show(this.eventReason);
        else ui.hide(this.eventReason);
        this.eventReason.innerHTML = event.for;
    },

    move: function(z) {
        this.tagRoot.style.zIndex = this.z = z;
    }
};

module.exports = Decal;