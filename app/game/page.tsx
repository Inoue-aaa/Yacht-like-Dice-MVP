"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const UPPER_CATEGORIES = ["ones", "twos", "threes", "fours", "fives", "sixes"] as const;
const CATEGORIES = [
  ...UPPER_CATEGORIES,
  "chance",
  "yacht",
  "threeKind",
  "fourKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
] as const;
const LOWER_CATEGORIES = CATEGORIES.filter(
  (category): category is Exclude<Category, UpperCategory> => !UPPER_CATEGORIES.includes(category as UpperCategory)
);
type Category = (typeof CATEGORIES)[number];
type UpperCategory = (typeof UPPER_CATEGORIES)[number];

const CATEGORY_VALUE: Record<UpperCategory, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

const CATEGORY_LABELS: Record<Category, string> = {
  ones: "1",
  twos: "2",
  threes: "3",
  fours: "4",
  fives: "5",
  sixes: "6",
  chance: "チャンス",
  yacht: "ヨット",
  threeKind: "スリーカード",
  fourKind: "フォーカード",
  fullHouse: "フルハウス",
  smallStraight: "ストレート（4連番）",
  largeStraight: "フルストレート（5連番）",
};

const DICE_COUNT = 5;
const MAX_ROLLS = 3;

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function createInitialDice() {
  return Array.from({ length: DICE_COUNT }, () => rollDie());
}

function sumDice(dice: number[]) {
  return dice.reduce((sum, value) => sum + value, 0);
}

function getCounts(dice: number[]) {
  const counts = new Map<number, number>();
  for (const value of dice) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function hasSequence(uniqueValues: number[], sequence: number[]) {
  return sequence.every((value) => uniqueValues.includes(value));
}

function calculateCategoryScore(category: Category, dice: number[]) {
  const total = sumDice(dice);
  const counts = getCounts(dice);
  const countValues = Array.from(counts.values());
  const uniqueValues = Array.from(new Set(dice)).sort((a, b) => a - b);

  if (category in CATEGORY_VALUE) {
    const targetValue = CATEGORY_VALUE[category as UpperCategory];
    return dice
      .filter((value) => value === targetValue)
      .reduce((sum, value) => sum + value, 0);
  }

  if (category === "chance") {
    return total;
  }

  if (category === "yacht") {
    return countValues.some((count) => count === 5) ? 50 : 0;
  }

  if (category === "threeKind") {
    return countValues.some((count) => count >= 3) ? total : 0;
  }

  if (category === "fourKind") {
    return countValues.some((count) => count >= 4) ? total : 0;
  }

  if (category === "fullHouse") {
    return countValues.includes(3) && countValues.includes(2) ? 25 : 0;
  }

  if (category === "smallStraight") {
    const isSmallStraight =
      hasSequence(uniqueValues, [1, 2, 3, 4]) ||
      hasSequence(uniqueValues, [2, 3, 4, 5]) ||
      hasSequence(uniqueValues, [3, 4, 5, 6]);
    return isSmallStraight ? 30 : 0;
  }

  if (category === "largeStraight") {
    const isLargeStraight =
      uniqueValues.length === 5 &&
      (hasSequence(uniqueValues, [1, 2, 3, 4, 5]) || hasSequence(uniqueValues, [2, 3, 4, 5, 6]));
    return isLargeStraight ? 40 : 0;
  }

  return 0;
}

export default function GamePage() {
  const [dice, setDice] = useState<number[]>(createInitialDice);
  const [held, setHeld] = useState<boolean[]>(Array(DICE_COUNT).fill(false));
  const [rollsLeft, setRollsLeft] = useState<number>(MAX_ROLLS - 1);
  const [scores, setScores] = useState<Partial<Record<Category, number>>>({});

  const gameOver = CATEGORIES.every((category) => scores[category] !== undefined);
  const candidateScores = useMemo(() => {
    const next: Record<Category, number> = {
      ones: 0,
      twos: 0,
      threes: 0,
      fours: 0,
      fives: 0,
      sixes: 0,
      chance: 0,
      yacht: 0,
      threeKind: 0,
      fourKind: 0,
      fullHouse: 0,
      smallStraight: 0,
      largeStraight: 0,
    };

    for (const category of CATEGORIES) {
      next[category] = calculateCategoryScore(category, dice);
    }

    return next;
  }, [dice]);

  const upperSubtotal = useMemo(
    () => UPPER_CATEGORIES.reduce((sum, category) => sum + (scores[category] ?? 0), 0),
    [scores]
  );
  const upperBonus = upperSubtotal >= 63 ? 35 : 0;
  const upperRemain = Math.max(0, 63 - upperSubtotal);
  const baseTotal = useMemo(
    () => CATEGORIES.reduce((sum, category) => sum + (scores[category] ?? 0), 0),
    [scores]
  );
  const totalScore = useMemo(
    () => baseTotal + upperBonus,
    [baseTotal, upperBonus]
  );

  const rollDice = () => {
    if (gameOver || rollsLeft <= 0) {
      return;
    }
    setDice((prev) => prev.map((value, index) => (held[index] ? value : rollDie())));
    setRollsLeft((prev) => prev - 1);
  };

  const toggleHold = (index: number) => {
    if (gameOver) {
      return;
    }
    setHeld((prev) => prev.map((isHeld, i) => (i === index ? !isHeld : isHeld)));
  };

  const commitCategory = (category: Category) => {
    if (scores[category] !== undefined || gameOver) {
      return;
    }

    const categoryScore = calculateCategoryScore(category, dice);

    setScores((prev) => ({ ...prev, [category]: categoryScore }));
    setHeld(Array(DICE_COUNT).fill(false));
    setRollsLeft(MAX_ROLLS - 1);
    setDice(createInitialDice());
  };

  const restart = () => {
    setDice(createInitialDice());
    setHeld(Array(DICE_COUNT).fill(false));
    setRollsLeft(MAX_ROLLS - 1);
    setScores({});
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-100">Yacht-like Dice MVP</h1>
        <Link href="/" className="text-sm text-amber-200 underline hover:text-amber-100">
          Back
        </Link>
      </div>

      <section className="rounded-lg border border-amber-100/25 bg-amber-950/40 p-4">
        <p className="mb-3 text-sm text-amber-100/85">
          ロール残り: <span className="font-semibold text-amber-50">{rollsLeft}</span>
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {dice.map((value, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleHold(index)}
              className={`h-14 w-14 rounded-md text-xl font-bold transition ${
                held[index]
                  ? "border-2 border-amber-200 bg-amber-700 text-amber-50 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "border border-amber-200/60 bg-amber-50 text-amber-900"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={rollDice}
          disabled={rollsLeft <= 0 || gameOver}
          className="rounded-md bg-amber-200 px-4 py-2 font-semibold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-amber-200/40 disabled:text-amber-100/70"
        >
          Roll
        </button>
      </section>

      <section className="rounded-lg border border-amber-100/25 bg-amber-950/40 p-4">
        <h2 className="mb-3 text-lg font-semibold text-amber-100">上段</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {UPPER_CATEGORIES.map((category) => {
            const score = scores[category];
            const used = score !== undefined;
            return (
              <button
                key={category}
                type="button"
                onClick={() => commitCategory(category)}
                disabled={used || gameOver}
                className={`rounded-md border p-3 text-left transition ${
                  used
                    ? "cursor-not-allowed border-emerald-300/45 bg-emerald-950/55 text-emerald-100"
                    : "border-amber-100/25 bg-amber-950/30 text-amber-100 enabled:hover:bg-amber-900/40"
                } ${
                  gameOver && !used ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                <div className={`font-medium ${used ? "text-emerald-100" : "text-amber-100"}`}>
                  {CATEGORY_LABELS[category]}
                </div>
                <div className={`text-sm ${used ? "text-emerald-200/90" : "text-amber-100/75"}`}>
                  {used ? `確定: ${score}` : `候補: ${candidateScores[category]}`}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-amber-100/25 bg-amber-950/40 p-4">
        <h2 className="mb-2 text-lg font-semibold text-amber-100">上段ボーナス進捗</h2>
        <p className="text-sm text-amber-100/80">上段合計: {upperSubtotal}</p>
        <p className="text-sm text-amber-100/80">ボーナス条件: 63以上で +35</p>
        {upperBonus > 0 ? (
          <p className="mt-1 font-semibold text-emerald-200">達成 +35</p>
        ) : (
          <p className="mt-1 text-sm text-amber-100/80">残り: {upperRemain}</p>
        )}
      </section>

      <section className="rounded-lg border border-amber-100/25 bg-amber-950/40 p-4">
        <h2 className="mb-3 text-lg font-semibold text-amber-100">役</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LOWER_CATEGORIES.map((category) => {
              const score = scores[category];
              const used = score !== undefined;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => commitCategory(category)}
                  disabled={used || gameOver}
                  className={`rounded-md border p-3 text-left transition ${
                    used
                      ? "cursor-not-allowed border-emerald-300/45 bg-emerald-950/55 text-emerald-100"
                      : "border-amber-100/25 bg-amber-950/30 text-amber-100 enabled:hover:bg-amber-900/40"
                  } ${
                    gameOver && !used ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <div className={`font-medium ${used ? "text-emerald-100" : "text-amber-100"}`}>
                    {CATEGORY_LABELS[category]}
                  </div>
                  <div className={`text-sm ${used ? "text-emerald-200/90" : "text-amber-100/75"}`}>
                    {used ? `確定: ${score}` : `候補: ${candidateScores[category]}`}
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      <section className="rounded-lg border border-amber-100/25 bg-amber-950/40 p-4">
        <p className="text-lg font-semibold text-amber-100">Total: {totalScore}</p>
        {gameOver && (
          <div className="mt-1 text-sm text-amber-100/75">
            <p>ゲーム終了</p>
            <p>Upper subtotal: {upperSubtotal}</p>
            <p>Upper bonus: +{upperBonus}</p>
          </div>
        )}
        <button
          type="button"
          onClick={restart}
          className="mt-3 rounded-md border border-amber-100/40 bg-amber-950/20 px-4 py-2 font-semibold text-amber-100 transition hover:bg-amber-900/35"
        >
          Restart
        </button>
      </section>
    </main>
  );
}
