import { Deck } from "./deck.js";
import { AnyRankName, AnySuitName, CardMapping, RankMapping, RankName, SuitMapping, allSuits, fakeRanks, floatingMappedRanks, getRank, getSuit, isFakeRank, isFakeSuit, isFloatingRank, isMappedSuit, isRealRank, isRealSuit, isRelativeRank, mappedSuits, rankLabels, ranks, relativeMappedRanks, suitLabels, suits } from "./defs.js";
import { factorial, memoize, nCr } from "./helpers.js";

export class ParseError extends Error {
}

export class Card {
    rank: AnyRankName;
    suit: AnySuitName;
    matches = NaN;

    // rough estimate of how much freedom there is in mapping this rule
    get freedom() {
        let freedom = 1;
        const {rank, suit} = this;
        if (suit === "?") freedom *= 4;
        else if (isMappedSuit(suit)) freedom *= 3;

        if (rank === "?") freedom *= 13;
        else if (isFloatingRank(rank)) freedom *= 12;
        else if (isRelativeRank(rank)) freedom *= 10;

        return memoize(this, "freedom", freedom);
    }

    constructor(rank: AnyRankName, suit: AnySuitName) {
        this.rank = String(rank) as RankName;
        this.suit = suit;
    }

    countMatches(cards: Card[], mappings: CardMapping): number {
        return cards.filter(c => c.cardMatches(this, mappings)).length;
    }

    toString() {
        if (this.rank === "*") {
            return "wild";
        }
        return `${rankLabels[this.rank as RankName] ?? `rank ${this.rank}`} of ${suitLabels[this.suit]}`;
    }

    short() {
        if (this.rank === "*") {
            return "wild";
        }
        return `${this.rank}${allSuits.get(this.suit)}`;
    }

    matchesRank(rule: Card, mappings: CardMapping): CardMapping | null {
        if (this.rank === "*") return mappings;
        
        let {rank} = rule;
        rank = (isFakeRank(rank) && rank in mappings) ? mappings[rank]! : rank;
        if (rank === this.rank || rank === "?") return mappings;

        if (isRealRank(this.rank) && isRelativeRank(rank)) {
            const rankValue = ranks[this.rank];
            const relativeBase = rankValue - relativeMappedRanks.indexOf(rank);
            const newMappings = {...mappings};
            for (const [i, relRank] of relativeMappedRanks.entries()) {
                const value = relativeBase + i;
                newMappings[relRank] = getRank(value) as RankName ?? "!";
            }
            return newMappings;
        } else if (isRealRank(this.rank) && isFloatingRank(rank)) {
            for (const float of floatingMappedRanks) {
                if (mappings[float] === this.rank) {
                    // already mapped
                    return null;
                }
            }
            return {
                ...mappings,
                [rank]: this.rank,
            }

        }
        return null;
    }

    matchesSuit(rule: Card, mappings: CardMapping): CardMapping | null {
        if (this.rank === "*") return mappings;

        let {suit} = rule;
        suit = (isFakeSuit(suit) && suit in mappings) ? mappings[suit]! : suit;
        if (suit === this.suit || suit === "?") return mappings;

        if (isRealSuit(this.suit) && isMappedSuit(suit)) {
            for (const mapped of mappedSuits) {
                if (mappings[mapped] === this.suit) {
                    return null;
                }
            }
            return {
                ...mappings,
                [suit]: this.suit,
            }
        }

        return null;
    }

    cardMatches(rule: Card, mappings: CardMapping = {}): CardMapping | null {
        mappings = this.matchesRank(rule, mappings)!;
        if (!mappings) return null;
        return this.matchesSuit(rule, mappings);
    }

    similarCards(deck: Deck) {
        let sameSuit = 0;
        let sameRank = 0;
        for (const card of deck) {
            if (card.suit === this.suit) sameSuit++;
            if (card.rank === this.rank) sameRank++;
        }
        return `${sameSuit},${sameRank}`;
    }

    static parseFrom(text: string): Card | null {
        const match = /^([a-zA-Z?]|\d+|\([^)]+\))([A-Z?\u1000-\uFFFF])$/u.exec(text);
        if (!match) return null;
        const [, rankSpec, suitSpec] = match;
        const rank = getRank(rankSpec);
        const suit = getSuit(suitSpec);
        if (rank && suit) {
            return new Card(rank, suit);
        }
        return null;
    }
}

export class Hand extends Array<Card> {
    name  = "";
    toString() {
        if (!this.length) return "Empty hand";
        let specs = this.map(String);
        for (let i = 0; i < specs.length; i++) {
            if (specs.slice(i+1).some(s => s === specs[i])) {
                const newSpecs = specs.filter((s, j) => s !== specs[i] || j === i);
                newSpecs[i] = `${specs.length - newSpecs.length + 1}× ${newSpecs[i]}`;
                specs = newSpecs;
            }
        }
        if (specs.length === this.length) {
            // couldn't simplify by joining, simplify by suit instead
            const suits: Record<string, string[]> = {};
            for (const spec of specs) {
                let [rank, suit] = spec.split(" of ");
                if (!rank) suit = "";
                (suits[suit] ??= []).push(rank);
            }
            specs.length = 0;
            for (const [suit, ranks] of Object.entries(suits)) {
                if (!suit) {
                    specs.push(...ranks)
                    continue;
                }
                if (ranks.length === 1) {
                    specs.push(`${ranks[0]} of ${suit}`);
                } else if (ranks.length === 2) {
                    specs.push(`${ranks[0]} and ${ranks[1]} of ${suit}`);
                } else {
                    specs.push(`${ranks.slice(0,-1).join(", ")}. and ${ranks.at(-1)} of ${suit}`);
                }
            }
        }
        return `${this.length} card${this.length !== 1 ? "s" : ""}: ${specs.join(", ")}`;
    }

    short() {
        if (!this.length) return "none";
        return this.map(c=>c.short()).join(", ");
    }

    static parseFrom(text: string, name = ""): Hand {
        const cardSpecs = text.replace(/,/g, " ").trim().split(/\s+/);
        const hand = new this();
        for (const spec of cardSpecs) {
            const card = Card.parseFrom(spec);
            if (!card) {
                throw new ParseError(`couldn't understand card specification: ${spec}`);
            }
            hand.push(card);
        }
        hand.name = name;
        return hand;
    }

    handMatches(rule: Hand, mappings: CardMapping = {}): CardMapping | null {
        let newMappings: CardMapping | null;
        if (rule.length === 0) return mappings;
        const ruleCard = rule[0];
        const restRule = rule.slice(1);
        for (let i = 0; i < this.length; i++) {
            if (newMappings = this[i].cardMatches(ruleCard, mappings)) {
                const rest = this.slice(0, i).concat(this.slice(i+1));
                const finalMapping = rest.handMatches(restRule, newMappings);
                if (finalMapping) return finalMapping;
            }
        }
        return null;
    }

    declare slice: (start?: number | undefined, end?: number | undefined) => this;
    declare concat: (...items: ConcatArray<Card>[]) => this;
    declare filter: (predicate: (value: Card, index: number, array: this) => unknown, thisArg?: any) => this;

}

export class HandRule extends Hand {
    value = NaN;
    frequency = NaN;
    ruleElement?: HTMLElement;

    toString(): string {
        if (!this.length) return "Empty rule";
        return super.toString();
    }

    calculateValue(deck: Deck, shuffles = 100): number {
        let count = 0, total = 0;
        while (shuffles-- > 0) {
            deck.shuffle();
            for (const hand of deck.dealHands()) {
                total++;
                if (hand.handMatches(this)) {
                    count++;
                }
            }
        }
        return this.value = total / count;
    }

    calculateFrequency(deck: Deck, handSize: number) {
        const self = this.filter(c => c.short() !== "??");
        if (self.some(c => c.short() === "??")) {
        }
        const minRelativeRank = Math.min(...self.map(c => isRelativeRank(c.rank) ? fakeRanks[c.rank] : Infinity));
        const maxRelativeRank = Math.max(...self.map(c => isRelativeRank(c.rank) ? fakeRanks[c.rank] : -Infinity));
        const maxRelativeOffset = 14 - maxRelativeRank + minRelativeRank;
        // console.log(`min/max relative rank in ${self.short()}:`, minRelativeRank, maxRelativeRank);
        const toCalculate = [{
            deck: deck.slice(),
            rule: self.slice(),
            freq: 1,
            mappings: {} as CardMapping,
        }]
        let totalFreq = 0;
        while (toCalculate.length) {
            const {deck, rule, freq, mappings} = toCalculate.shift()!;
            if (!rule.length) {
                // console.log(`adding freq ${freq} to total`);
                totalFreq += freq;
                continue;
            }
            rule.forEach(c => c.matches = c.countMatches(deck, mappings));
            rule.sort((a, b) => a.matches - b.matches);
            const cardRule = rule.shift()!;
            // console.log(`Matching card rule ${cardRule.short()}`)
            const matchedCards = deck.filter(c => {
                const newMappings = c.cardMatches(cardRule, mappings);
                if (newMappings?.a) {
                    const relOffset = ranks[newMappings.a];
                    if (!Number.isFinite(relOffset) || relOffset > maxRelativeOffset || relOffset < -minRelativeRank) {
                        // console.log(`got relOffset ${relOffset} out of range for card ${c.short()}`);
                        return false;
                    } else {
                        // console.log(`got relOffset ${relOffset} in range for card ${c.short()}`);
                        return true;
                    }
                }
                return !!newMappings;
            });
            const matchDomains: Record<string, Card> = {};
            for (const card of matchedCards) {
                const similar = card.similarCards(deck);
                if (matchDomains[similar]) {
                    matchDomains[similar].matches++;
                } else {
                    card.matches = 1;
                    matchDomains[similar] = card;
                }
            }
            // const domains = Object.keys(matchDomains);
            // console.log(`${domains.length} match domains: `, domains.join("; "), Object.values(matchDomains));
            const useCards = Object.values(matchDomains);

            for (const [i, card] of useCards.entries()) {
                const useDeck = i === useCards.length - 1 ? deck : deck.slice();
                const useRule = i === useCards.length - 1 ? rule : rule.slice();
                useDeck.removeCard(card);
                toCalculate.push({
                    deck: useDeck,
                    rule: useRule,
                    freq: freq * card.matches,
                    mappings: card.cardMatches(cardRule, mappings)!,
                });
                const calc = toCalculate.at(-1)!;
                // console.log("added to stack:", card.short(), calc.deck, calc.rule.short(), calc.freq, Object.entries(calc.mappings).map(([k,v]) => `${k}=${v}`).join());
            }
        }
        const remainingCards = handSize - self.length;
        // console.log(`multiplying freq ${totalFreq} by (${deck.length - self.length} ${remainingCards})`);
        totalFreq *= nCr(deck.length - self.length, remainingCards);
        const ruleCounts: Record<string, number> = {};
        for (const cardRule of self) {
            ruleCounts[cardRule.short()] ??= 0;
            ruleCounts[cardRule.short()]++;
        }
        const perms = Object.values(ruleCounts).map(c => factorial(c)).reduce((a, b) => a * b, 1);
        if (perms > 1) {
            // console.log(`dividing freq ${totalFreq} by total perms ${perms}`);
            totalFreq /= perms;
        }
        return totalFreq;
    }

    declare static parseFrom: (text: string, name?: string) => HandRule;
}

Object.assign(self, {
    Card, Hand,
})