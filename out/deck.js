import { Card, Hand } from "./cards.js";
import { nCr } from "./helpers.js";
export class Deck extends Array {
    static create(ranks, suits, ...extraCards) {
        const deck = new this();
        return deck.set(ranks, suits, ...extraCards);
    }
    set(ranks, suits, ...extraCards) {
        this.length = 0;
        for (const suit of suits) {
            for (const rank of ranks) {
                this.addCard(new Card(rank, suit));
            }
        }
        for (const card of extraCards) {
            this.addCard(card);
        }
        return this;
    }
    addCard(card) {
        this.push(card);
    }
    removeCard(card) {
        const index = this.indexOf(card);
        if (index >= 0) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }
    shuffle() {
        const { length } = this;
        for (let i = 0; i < length; i++) {
            const index = Math.floor(Math.random() * length);
            [this[i], this[index]] = [this[index], this[i]];
        }
        return this;
    }
    dealHands(handSize = 5) {
        const hands = [];
        const deck = this.slice();
        while (deck.length > 0) {
            const hand = new Hand();
            while (hand.length < handSize && deck.length > 0) {
                hand.push(deck.pop());
            }
            if (hand.length === handSize) {
                hands.push(hand);
            }
        }
        return hands;
    }
    handCount(handSize = 5) {
        return nCr(this.length, handSize);
    }
}
//# sourceMappingURL=deck.js.map