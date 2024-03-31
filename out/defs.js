import { typedEntries } from "./helpers.js";
export const suits = {
    C: "♣",
    D: "♦",
    H: "♥",
    S: "♠",
};
export const fakeSuits = {
    R: "●",
    B: "■",
    T: "▲",
    P: "⬟",
    "?": "?",
};
export const allSuits = new Map([
    ...typedEntries(suits),
    ...typedEntries(fakeSuits),
]);
export const allSymbols = Object.values(allSuits).join("");
export const mappedSuits = "RBTP".split("");
export function getSuit(spec) {
    for (const [name, symbol] of allSuits.entries()) {
        if (spec === name || spec === symbol)
            return name;
    }
    return null;
}
export function isRealSuit(suit) {
    return Object.hasOwn(suits, suit);
}
export function isFakeSuit(suit) {
    return Object.hasOwn(fakeSuits, suit);
}
export function isMappedSuit(suit) {
    return Object.hasOwn(fakeSuits, suit) && suit !== "?";
}
export const suitLabels = {
    C: "clubs",
    D: "diamonds",
    H: "hearts",
    S: "spades",
    R: "rounds",
    B: "boxes",
    T: "triangles",
    P: "pentagons",
    "?": "any suit",
};
export const ranks = {
    "?": NaN,
    "*": NaN,
    "!": NaN,
    A: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
};
export const fakeRanks = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
    i: 8,
    j: 9,
    k: 10,
    l: 11,
    m: 12,
    n: NaN,
    o: NaN,
    p: NaN,
    q: NaN,
    r: NaN,
    s: NaN,
    t: NaN,
    u: NaN,
    v: NaN,
    w: NaN,
    x: NaN,
    y: NaN,
    z: NaN,
};
export const actualRanks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];
export const ranksByValue = [
    undefined, // 0
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
];
export const allRanks = new Map([
    ...typedEntries(ranks),
    ...typedEntries(fakeRanks),
]);
export const relativeMappedRanks = "abcdefghijklm".split("");
export const floatingMappedRanks = "nopqrstuvwxyz".split("");
export function getRank(spec) {
    if (allRanks.has(String(spec)))
        return String(spec);
    const value = typeof spec === "number" ? spec : parseInt(spec);
    if (ranksByValue[value]) {
        return ranksByValue[value];
    }
    return null;
}
export function isRealRank(rank) {
    return Object.hasOwn(ranks, rank) && rank !== "?" && rank !== "*" && rank !== "!";
}
export function isFakeRank(rank) {
    return Object.hasOwn(fakeRanks, rank);
}
export function isRelativeRank(rank) {
    return relativeMappedRanks.includes(rank);
}
export function isFloatingRank(rank) {
    return floatingMappedRanks.includes(rank);
}
export const rankLabels = {
    "?": "any rank",
    "*": "wild",
    "!": "invalid card",
    A: "ace",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    J: "jack",
    Q: "queen",
    K: "king",
};
export const pokerHands = {
    "Royal flush": "AR KR QR JR 10R",
    "Straight flush": "aR bR cR dR eR",
    "Five of a kind": "x? x? x? x? x?",
    "Four of a kind": "x? x? x? x?",
    "Full house": "x? x? x? y? y?",
    "Flush": "?R ?R ?R ?R ?R",
    "Straight": "a? b? c? d? e?",
    "Three of a kind": "x? x? x?",
    "Two pair": "x? x? y? y?",
    "Pair": "x? x?",
};
Object.assign(self, {
    suits, suitLabels, allSuits, ranks, getSuit, getRank, pokerHands
});
//# sourceMappingURL=defs.js.map