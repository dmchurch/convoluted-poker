import { Card, Hand } from "./cards.js";
import { RankName, SuitName } from "./defs.js";
import { nCr } from "./helpers.js";

export class Deck extends Array<Card> {
    static create(ranks: RankName[], suits: SuitName[], ...extraCards: Card[]): Deck {
        const deck = new this();
        return deck.set(ranks, suits, ...extraCards);
    }
    set(ranks: RankName[], suits: SuitName[], ...extraCards: Card[]) {
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
    addCard(card: Card) {
        this.push(card);
    }

    removeCard(card: Card) {
        const index = this.indexOf(card);
        if (index >= 0) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }

    shuffle() {
        const {length} = this;
        for (let i = 0; i < length; i++) {
            const index = Math.floor(Math.random() * length);
            [this[i], this[index]] = [this[index], this[i]]
        }
        return this;
    }

    dealHands(handSize = 5): Hand[] {
        const hands: Hand[] = [];
        const deck = this.slice();
        while (deck.length > 0) {
            const hand = new Hand();
            while (hand.length < handSize && deck.length > 0) {
                hand.push(deck.pop()!);
            }
            if (hand.length === handSize) {
                hands.push(hand);
            }
        }
        return hands;
    }

    handCount(handSize = 5): number {
        return nCr(this.length, handSize);
    }

    declare slice: (start?: number | undefined, end?: number | undefined) => this;
    declare concat: (...items: ConcatArray<Card>[]) => this;
}