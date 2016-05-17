var ui = require('../ui'),
    info = require('../../shared/info');

function Card() {
    this.tagRoot = ui.create('div', 'card');
    this.tagRoot.style.fontSize = Card.hoverScale + 'em';
    this.tagFace = ui.create('div', 'face', this.tagRoot);
    this.tagFaceName = ui.create('div', 'name', this.tagFace);
    this.tagFaceImage = ui.create('div', 'image', this.tagFace);
    this.tagFaceDescription = ui.create('div', 'description', this.tagFace);
    this.tagFaceType = ui.create('div', 'type', this.tagFace);
    this.tagFaceTypeRank = ui.create('div', 'rank', this.tagFaceType);
    this.tagFaceTypeSuit = ui.create('div', 'suit', this.tagFaceType);

    this.tagBack = ui.create('div', 'back', this.tagRoot);

    this.onMoveFinish = () => {
        if (this.tempZ !== null) {
            this.tagRoot.style.zIndex = this.z;
            this.tempZ = null;
        }
        this.tagRoot.classList.remove('moving');
    }

    this.tempZ = null;
    this.move(0, 0, 0, 0);
}
Card.hoverScale = 1.5;
Card.transitionTime = 350;
Card.prototype = {
    constructor: Card,

    is: function(info) {
        return (this.info && info) ? (
            (info.name && info.name === this.info.name) ||
            (info.id && info.id === this.info.id)
        ) : (!this.info && !info);
    },

    isId: function(id) {
        return this.info ?
            ((this.info.name || this.info.id) === id) :
            (!this.info && !id);
    },

    setInfo: function(card) {
        if (this.info && card && this.info.id === card.id) return this;

        this.tagRoot.classList.remove('character', 'role');
        this.tagBack.innerHTML = '';

        this.info = card;
        if (this.info && this.info.id) {
            let split = this.info.id.split(':');
            let name = split[0];
            let cardInfo = info.cards[name];
            this.tagFace.className = 'face ' + cardInfo.type;
            this.tagFaceName.innerHTML = cardInfo.name;
            this.tagFaceDescription.innerHTML = cardInfo.description;
            this.tagFaceTypeSuit.className = 'suit ' + split[1];
            this.tagFaceTypeRank.className = 'rank ' + split[2];
            this.visible();
        } else {
            this.tagFace.className = 'face';
            this.tagFaceName.innerHTML = '';
            this.tagFaceDescription.innerHTML = '';
            this.tagFaceTypeSuit.className = 'suit';
            this.tagFaceTypeRank.className = 'rank';
            this.unknown();
        }

        return this;
    },

    setCharacter: function(char) {
        if (this.info && char && this.info.name === char.name) return this;

        this.tagRoot.classList.remove('role');
        this.tagRoot.classList.add('character');
        this.tagBack.innerHTML = '';
        this.info = char;
        for (let i = 1; i <= 5; i++) ui.create('div', 'bullet-' + i, this.tagBack);

        if (char && char.name) {
            let charInfo = info.characters[char.name];
            this.tagFaceName.innerHTML = char.name;
            this.tagFaceDescription.innerHTML = charInfo.description;
            this.visible();
        } else this.unknown();

        return this;
    },

    setRole: function(role) {
        if (this.info && role && this.info.name === role.name) return this;

        this.tagRoot.classList.remove('character');
        this.tagRoot.classList.add('role');
        this.tagBack.innerHTML = '';
        this.info = role;

        if (role && role.name) {
            let roleInfo = info.roles[role.name];
            if (roleInfo) {
                this.visible();
                this.tagFaceName.innerHTML = roleInfo.name;
                this.tagFaceDescription.innerHTML = roleInfo.description;
            } else this.unknown();
        } else this.unknown();

        return this;
    },

    actionable: function(onAction) {
        this.tagRoot.classList.add('actionable');
        this.tagRoot.onclick = onAction;
        return this;
    },
    unactionable: function() {
        this.tagRoot.classList.remove('actionable');
        this.tagRoot.onclick = null;
        return this;
    },
    known: function() {
        this.tagRoot.classList.remove('visible');
        this.tagRoot.classList.add('known');
        return this;
    },
    unknown: function() {
        this.tagRoot.classList.remove('known', 'visible');
        return this;
    },
    visible: function() {
        this.tagRoot.classList.remove('known');
        this.tagRoot.classList.add('visible');
        return this;
    },

    move: function(x, y, z, angle) {
        while (angle > Math.PI) angle -= Math.TWO_PI;
        while (angle < -Math.PI) angle += Math.TWO_PI;
        angle = (angle !== undefined && angle !== null) ? angle : this.angle;
        x = Math.round(x);
        y = Math.round(y);
        // we assume the z is an integer

        if (x === this.x && y === this.y && z === this.z && angle === this.angle)
            return this;

        this.tagRoot.classList.add('moving');
        this.tagRoot.style.left = (this.x = x) + 'px';
        this.tagRoot.style.top = (this.y = y) + 'px';
        this.z = z;
        if (this.tempZ === null) this.tagRoot.style.zIndex = z;
        this.tagRoot.style.transform =
            'scale(' + (1/Card.hoverScale) + ') ' +
            'rotateZ(' + (this.angle = angle) + 'rad) ';
        setTimeout(this.onMoveFinish, Card.transitionTime);

        return this;
    },
    transitionZ: function(z) {
        this.tagRoot.style.zIndex = z;
        this.tempZ = z;
        return this;
    },

    getWidth: function() {
        return this.tagRoot.offsetWidth / Card.hoverScale;
    },
    getHeight: function() {
        return this.tagRoot.offsetHeight / Card.hoverScale;
    }
};

module.exports = Card;