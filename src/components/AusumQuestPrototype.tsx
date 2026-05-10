import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Shield,
  Zap,
  Star,
  Map,
  Brain,
  Volume2,
  Flame,
  Trophy,
  Lock,
  CheckCircle2,
  LifeBuoy,
} from "lucide-react";

type Mission = {
  id: number;
  worldId: number;
  title: string;
  type: string;
  prompt: string;
  choices: string[];
  answer: string;
  reward: number;
  xpReward: number;
  skill: string;
  explanation: string;
};

type World = {
  id: number;
  title: string;
  description: string;
};

type ActiveModal = null | "missionComplete" | "worldComplete" | "incorrectAdvance";
type MissionStatus = "mastered" | "completed" | "assisted" | "current" | "unlocked" | "locked";
type SoundType = "correct" | "incorrect" | "worldComplete" | "gameComplete" | "rankUp";

type ModalData = {
  mission?: Mission;
  energyEarned?: number;
  xpEarned?: number;
  rank?: string;
  rankUp?: boolean;
  completedWorldId?: number;
  completedWorldTitle?: string;
  incorrectAnswer?: string;
  correctAnswer?: string;
};

const LEVEL_XP = 100;

const introStoryLines = [
  "The Ausum Realm was once powered by crystal energy, clear thinking, and brave explorers.",
  "But the worlds have become unstable.",
  "Signal towers are fading.",
  "Memory paths are breaking.",
  "Shadow systems are spreading confusion.",
  "Auri has been searching for someone with the focus and ability to restore balance.",
  "That explorer is you.",
];

const introRevealSchedule = [0, 3000, 6000, 9000, 12000, 15000, 22000];
const introButtonDelay = 26000;

function playSound(enabled: boolean, type: SoundType) {
  if (!enabled) return;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  const soundMap: Record<SoundType, { frequency: number; duration: number; volume: number }> = {
    correct: { frequency: 660, duration: 0.16, volume: 0.045 },
    incorrect: { frequency: 220, duration: 0.14, volume: 0.035 },
    worldComplete: { frequency: 784, duration: 0.28, volume: 0.05 },
    gameComplete: { frequency: 880, duration: 0.35, volume: 0.05 },
    rankUp: { frequency: 740, duration: 0.24, volume: 0.05 },
  };

  const sound = soundMap[type];
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(sound.volume, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + sound.duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + sound.duration + 0.03);
}

const worlds: World[] = [
  {
    id: 1,
    title: "Crystal Valley",
    description: "Warm up logic, patterns, and energy skills to power the valley gates.",
  },
  {
    id: 2,
    title: "Signal City",
    description: "Decode language clues and clear communication missions.",
  },
  {
    id: 3,
    title: "Shadow Forest",
    description: "Use focus, memory, and deduction to complete final support missions.",
  },
];

const missions: Mission[] = [
  {
    id: 1,
    worldId: 1,
    title: "Power the First Gate",
    type: "Logic Mission",
    prompt: "A gate opens when the pattern is complete: 2, 4, 6, 8, __",
    choices: ["9", "10", "12", "14"],
    answer: "10",
    reward: 20,
    xpReward: 35,
    skill: "Pattern recognition",
    explanation: "The pattern counts by 2, so the next number is 10.",
  },
  {
    id: 2,
    worldId: 1,
    title: "Charge the Crystal",
    type: "Math Mission",
    prompt: "The crystal needs 12 energy points. You already have 7. How many more do you need?",
    choices: ["3", "4", "5", "6"],
    answer: "5",
    reward: 20,
    xpReward: 35,
    skill: "Subtraction",
    explanation: "12 - 7 = 5.",
  },
  {
    id: 3,
    worldId: 1,
    title: "Pattern Bridge",
    type: "Logic Mission",
    prompt: "What comes next in this pattern? Red, Blue, Red, Blue, __",
    choices: ["Red", "Blue", "Green", "Yellow"],
    answer: "Red",
    reward: 25,
    xpReward: 40,
    skill: "Pattern recognition",
    explanation: "The pattern repeats Red, Blue, so the next color is Red.",
  },
  {
    id: 4,
    worldId: 1,
    title: "Energy Match",
    type: "Math Mission",
    prompt: "Which two numbers add up to 10?",
    choices: ["5 + 5", "4 + 4", "6 + 5", "7 + 2"],
    answer: "5 + 5",
    reward: 20,
    xpReward: 35,
    skill: "Addition",
    explanation: "5 + 5 = 10. The other choices equal 8, 11, and 9.",
  },
  {
    id: 5,
    worldId: 1,
    title: "Crystal Path",
    type: "Logic Mission",
    prompt: "If you follow a new path through the valley, what are you most likely doing?",
    choices: ["Sleeping", "Going backward", "Stopping", "Exploring"],
    answer: "Exploring",
    reward: 25,
    xpReward: 40,
    skill: "Reasoning",
    explanation: "Following a new path means you are exploring.",
  },
  {
    id: 6,
    worldId: 2,
    title: "Speak the Command",
    type: "Voice Mission",
    prompt: "Say or choose the command that would help a teammate: 'I need help, please.'",
    choices: ["Go away", "I need help, please", "That is mine", "Stop talking"],
    answer: "I need help, please",
    reward: 30,
    xpReward: 45,
    skill: "Functional communication",
    explanation: "Asking for help clearly and politely supports communication.",
  },
  {
    id: 7,
    worldId: 2,
    title: "Decode the Signal",
    type: "Reading Mission",
    prompt:
      "Choose the word that best completes the sentence: The explorer was brave because he kept going even when he felt __.",
    choices: ["hungry", "sleepy", "quiet", "afraid"],
    answer: "afraid",
    reward: 25,
    xpReward: 40,
    skill: "Inference",
    explanation: "Bravery means continuing even when afraid.",
  },
  {
    id: 8,
    worldId: 2,
    title: "Speak the Signal",
    type: "Voice Mission",
    prompt: "What is a clear way to ask someone a question?",
    choices: [
      "Why don't you know?",
      "You should know this.",
      "Can you help me understand this?",
      "That makes no sense.",
    ],
    answer: "Can you help me understand this?",
    reward: 30,
    xpReward: 45,
    skill: "Clear communication",
    explanation: "This response asks for help respectfully and clearly.",
  },
  {
    id: 9,
    worldId: 2,
    title: "Decode the Message",
    type: "Reading Mission",
    prompt: "A sign says: 'Wet Paint.' What should you do?",
    choices: ["Touch it to feel the paint", "Paint it more", "Ignore it", "Read the sign and do not touch it"],
    answer: "Read the sign and do not touch it",
    reward: 25,
    xpReward: 40,
    skill: "Reading comprehension",
    explanation: "The sign gives information that helps you make a safe choice.",
  },
  {
    id: 10,
    worldId: 3,
    title: "Memory Path",
    type: "Memory Mission",
    prompt: "You see three items: a key, a book, and a light. Which item was shown second?",
    choices: ["A book", "A key", "A light", "None of them"],
    answer: "A book",
    reward: 30,
    xpReward: 45,
    skill: "Memory",
    explanation: "The order was key, book, light. The book was second.",
  },
  {
    id: 11,
    worldId: 3,
    title: "Hidden Clue",
    type: "Logic Mission",
    prompt: "If the pattern is: 2, 4, 6, 8, 10, what number comes next?",
    choices: ["11", "14", "12", "20"],
    answer: "12",
    reward: 25,
    xpReward: 40,
    skill: "Deduction",
    explanation: "The pattern counts by 2, so the next number is 12.",
  },
  {
    id: 12,
    worldId: 3,
    title: "Logic Gate",
    type: "Logic Mission",
    prompt: "All oak trees are trees. Most trees have leaves. What is the best answer?",
    choices: ["Oak trees are robots", "Oak trees usually have leaves", "Oak trees are not trees", "Oak trees are signs"],
    answer: "Oak trees usually have leaves",
    reward: 30,
    xpReward: 45,
    skill: "Logical reasoning",
    explanation: "Oak trees are trees, and trees usually have leaves.",
  },
  {
    id: 13,
    worldId: 3,
    title: "Final Focus Gate",
    type: "Strategy Mission",
    prompt: "You are stuck on a hard challenge. What is the best next step?",
    choices: ["Quit forever", "Guess fast", "Delete the game", "Pause, breathe, and try a strategy"],
    answer: "Pause, breathe, and try a strategy",
    reward: 35,
    xpReward: 50,
    skill: "Self-management",
    explanation: "Pausing and using a strategy helps you stay focused and keep going.",
  },
];

const companionMessages = {
  start: "Welcome to AUSUM Quest. The Ausum Realm needs your thinking power.",
  correct: "Excellent! You powered the quest and earned rewards.",
};

function getRankForXp(xp: number) {
  if (xp >= 600) return "The Ausum Realm Legend";
  if (xp >= 400) return "Shadow Strategist";
  if (xp >= 250) return "Signal Champion";
  if (xp >= 150) return "Crystal Guardian";
  if (xp >= 100) return "Quest Builder";
  if (xp >= 50) return "Path Finder";
  return "New Explorer";
}

function getWorldTitle(worldId: number) {
  return worlds.find((world) => world.id === worldId)?.title ?? "";
}

function getWorldMissions(worldId: number) {
  return missions.filter((mission) => mission.worldId === worldId);
}

function isWorldComplete(worldId: number, completedIds: number[]) {
  return getWorldMissions(worldId).every((mission) => completedIds.includes(mission.id));
}

function getActiveWorldId(completedIds: number[]) {
  if (!isWorldComplete(1, completedIds)) return 1;
  if (!isWorldComplete(2, completedIds)) return 2;
  if (!isWorldComplete(3, completedIds)) return 3;
  return null;
}

function getCurrentMission(completedIds: number[]) {
  const activeWorldId = getActiveWorldId(completedIds);
  if (activeWorldId === null) return null;

  return (
    missions.find((mission) => mission.worldId === activeWorldId && !completedIds.includes(mission.id)) ?? null
  );
}

export default function AusumQuestPrototype() {
  const [energy, setEnergy] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState(companionMessages.start);
  const [selected, setSelected] = useState<string | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [masteredCompleted, setMasteredCompleted] = useState<number[]>([]);
  const [completedCorrect, setCompletedCorrect] = useState<number[]>([]);
  const [assistedCompleted, setAssistedCompleted] = useState<number[]>([]);
  const [pendingCompletedMission, setPendingCompletedMission] = useState<Mission | null>(null);
  const [streak, setStreak] = useState(0);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [flashAnswerArea, setFlashAnswerArea] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showFinalRestoreScreen, setShowFinalRestoreScreen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({});
  const [selectedWorldId, setSelectedWorldId] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [visibleIntroLines, setVisibleIntroLines] = useState(0);
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    if (!showIntro) return;

    const lineTimers = introRevealSchedule.map((delay, index) =>
      window.setTimeout(() => {
        setVisibleIntroLines(index + 1);
      }, delay)
    );

    const buttonTimer = window.setTimeout(() => {
      setIntroReady(true);
    }, introButtonDelay);

    return () => {
      lineTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(buttonTimer);
    };
  }, [showIntro]);

  const currentMission = getCurrentMission(completed);
  const activeWorldId = getActiveWorldId(completed);
  const currentRank = useMemo(() => getRankForXp(xp), [xp]);
  const progress = Math.round((completed.length / missions.length) * 100);
  const xpProgress = Math.round(((xp % LEVEL_XP) / LEVEL_XP) * 100);
  const xpFill = xp > 0 ? Math.max(6, xpProgress) : 0;

  const worldProgress = worlds.map((world) => {
    const worldMissions = getWorldMissions(world.id);
    const completedCount = worldMissions.filter((mission) => completed.includes(mission.id)).length;
    const masteredCount = worldMissions.filter((mission) => masteredCompleted.includes(mission.id)).length;
    const completedCorrectCount = worldMissions.filter((mission) => completedCorrect.includes(mission.id)).length;
    const assistedCount = worldMissions.filter((mission) => assistedCompleted.includes(mission.id)).length;
    const percent = Math.round((completedCount / worldMissions.length) * 100);
    const restored = isWorldComplete(world.id, completed);
    const unlocked = world.id === 1 || isWorldComplete(world.id - 1, completed);
    const active = activeWorldId === world.id && !restored;

    return {
      ...world,
      missions: worldMissions,
      completedCount,
      masteredCount,
      completedCorrectCount,
      assistedCount,
      percent,
      restored,
      unlocked,
      active,
    };
  });

  function getMissionStatus(mission: Mission): MissionStatus {
    if (masteredCompleted.includes(mission.id)) return "mastered";
    if (completedCorrect.includes(mission.id)) return "completed";
    if (assistedCompleted.includes(mission.id)) return "assisted";
    if (currentMission?.id === mission.id) return "current";

    const world = worldProgress.find((item) => item.id === mission.worldId);
    if (world?.unlocked && mission.worldId === activeWorldId) return "unlocked";

    return "locked";
  }

  function focusWorld(worldId: number, unlocked: boolean) {
    if (!unlocked) return;
    setSelectedWorldId(worldId);
  }

  function chooseAnswer(choice: string) {
    if (!currentMission || activeModal !== null) return;

    setSelected(choice);

    if (choice === currentMission.answer) {
      const previousRank = getRankForXp(xp);
      const isMastered = wrongAttempts === 0;
      const earnedEnergy = isMastered ? currentMission.reward : Math.ceil(currentMission.reward / 2);
      const earnedXp = isMastered ? currentMission.xpReward : Math.ceil(currentMission.xpReward / 2);
      const newEnergy = energy + earnedEnergy;
      const newXp = xp + earnedXp;
      const newRank = getRankForXp(newXp);
      const newLevel = Math.floor(newXp / LEVEL_XP) + 1;
      const newStreak = isMastered ? streak + 1 : 0;
      const newCompleted = [...new Set([...completed, currentMission.id])];
      const completedThisWorld = isWorldComplete(currentMission.worldId, newCompleted);

      setEnergy(newEnergy);
      setXp(newXp);
      setLevel(newLevel);
      setStreak(newStreak);
      setPendingCompletedMission(currentMission);
      setWrongAttempts(0);
      setWrongChoice(null);
      setFlashAnswerArea(false);

      let successMessage = companionMessages.correct;
      if (newStreak === 2) successMessage = "Great momentum. Keep the streak going.";
      if (newStreak === 3) successMessage = "Excellent streak. You are focused and steady.";
      if (newStreak >= 4) successMessage = "Legend streak. Your focus is outstanding.";
      setMessage(successMessage);
      playSound(soundEnabled, previousRank !== newRank ? "rankUp" : "correct");

      setModalData({
        mission: currentMission,
        energyEarned: earnedEnergy,
        xpEarned: earnedXp,
        rank: newRank,
        rankUp: previousRank !== newRank,
        completedWorldId: completedThisWorld ? currentMission.worldId : undefined,
        completedWorldTitle: completedThisWorld ? getWorldTitle(currentMission.worldId) : undefined,
      });

      setActiveModal("missionComplete");
      return;
    }

    playSound(soundEnabled, "incorrect");
    setEnergy((prev) => Math.max(0, prev - 2));
    setWrongChoice(choice);
    setFlashAnswerArea(true);

    const nextWrongAttempts = wrongAttempts + 1;
    setWrongAttempts(nextWrongAttempts);

    if (nextWrongAttempts >= 2) {
      setStreak(0);
      setMessage("That answer was not correct. Let's try the next mission.");
      setWrongAttempts(0);
      setModalData({
        mission: currentMission,
        energyEarned: 0,
        xpEarned: 0,
        rank: currentRank,
        rankUp: false,
        incorrectAnswer: choice,
        correctAnswer: currentMission.answer,
      });
      setActiveModal("incorrectAdvance");
      return;
    }

    setTimeout(() => {
      setSelected(null);
      setWrongChoice(null);
      setFlashAnswerArea(false);
    }, 350);

    setMessage("Nice effort. Small energy dip only. Try again right away.");
  }

  function continueMissionComplete() {
    if (!pendingCompletedMission) return;

    const newCompleted = [...new Set([...completed, pendingCompletedMission.id])];
    const wasMastered = modalData.energyEarned === pendingCompletedMission.reward && modalData.xpEarned === pendingCompletedMission.xpReward;
    const newMasteredCompleted = wasMastered
      ? [...new Set([...masteredCompleted, pendingCompletedMission.id])]
      : masteredCompleted.filter((id) => id !== pendingCompletedMission.id);
    const newCompletedCorrect = wasMastered
      ? completedCorrect.filter((id) => id !== pendingCompletedMission.id)
      : [...new Set([...completedCorrect, pendingCompletedMission.id])];
    const newAssistedCompleted = assistedCompleted.filter((id) => id !== pendingCompletedMission.id);
    const completedWorldId = modalData.completedWorldId;

    setSelected(null);
    setWrongChoice(null);
    setFlashAnswerArea(false);
    setCompleted(newCompleted);
    setMasteredCompleted(newMasteredCompleted);
    setCompletedCorrect(newCompletedCorrect);
    setAssistedCompleted(newAssistedCompleted);
    setPendingCompletedMission(null);

    if (completedWorldId) {
      playSound(soundEnabled, "worldComplete");
      setActiveModal("worldComplete");
      return;
    }

    setModalData({});
    setActiveModal(null);

    const nextMission = getCurrentMission(newCompleted);
    if (nextMission) {
      setSelectedWorldId(nextMission.worldId);
      setMessage(`Adventure continues in ${getWorldTitle(nextMission.worldId)}.`);
    } else {
      setShowFinalRestoreScreen(true);
      setMessage("Quest complete.");
    }
  }

  function continueIncorrectAdvance() {
    if (!modalData.mission) return;

    const newCompleted = [...new Set([...completed, modalData.mission.id])];
    const newAssistedCompleted = [...new Set([...assistedCompleted, modalData.mission.id])];
    const newMasteredCompleted = masteredCompleted.filter((id) => id !== modalData.mission?.id);
    const newCompletedCorrect = completedCorrect.filter((id) => id !== modalData.mission?.id);
    const completedWorldId = isWorldComplete(modalData.mission.worldId, newCompleted)
      ? modalData.mission.worldId
      : undefined;
    const completedWorldTitle = completedWorldId ? getWorldTitle(completedWorldId) : undefined;

    setSelected(null);
    setWrongChoice(null);
    setFlashAnswerArea(false);
    setCompleted(newCompleted);
    setAssistedCompleted(newAssistedCompleted);
    setMasteredCompleted(newMasteredCompleted);
    setCompletedCorrect(newCompletedCorrect);
    setPendingCompletedMission(null);
    setWrongAttempts(0);
    setStreak(0);

    if (completedWorldId) {
      playSound(soundEnabled, "worldComplete");
      setModalData({ completedWorldId, completedWorldTitle });
      setActiveModal("worldComplete");
      return;
    }

    setModalData({});
    setActiveModal(null);

    const nextMission = getCurrentMission(newCompleted);
    if (nextMission) {
      setSelectedWorldId(nextMission.worldId);
      setMessage(`Adventure continues in ${getWorldTitle(nextMission.worldId)}.`);
    } else {
      setShowFinalRestoreScreen(true);
      setMessage("Quest complete. The Ausum Realm has been restored.");
    }
  }

  function continueWorldComplete() {
    setSelected(null);
    setWrongChoice(null);
    setFlashAnswerArea(false);

    const nextMission = getCurrentMission(completed);

    setModalData({});
    setActiveModal(null);

    if (nextMission) {
      setSelectedWorldId(nextMission.worldId);
      setShowFinalRestoreScreen(false);
      setMessage(`Adventure continues in ${getWorldTitle(nextMission.worldId)}.`);
      return;
    }

    setShowFinalRestoreScreen(true);
    playSound(soundEnabled, "gameComplete");
    setMessage("Quest complete. The Ausum Realm has been restored.");
  }

  function restartQuest() {
    setEnergy(0);
    setXp(0);
    setLevel(1);
    setMessage(companionMessages.start);
    setSelected(null);
    setCompleted([]);
    setMasteredCompleted([]);
    setCompletedCorrect([]);
    setAssistedCompleted([]);
    setPendingCompletedMission(null);
    setStreak(0);
    setWrongChoice(null);
    setFlashAnswerArea(false);
    setWrongAttempts(0);
    setActiveModal(null);
    setModalData({});
    setShowFinalRestoreScreen(false);
    setSelectedWorldId(1);
    setShowIntro(true);
    setVisibleIntroLines(0);
    setIntroReady(false);
  }

  const gameComplete = currentMission === null && showFinalRestoreScreen;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 40, 0], x: [-20, 20, -20] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0], x: [20, -20, 20] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative mx-auto w-full"
              style={{ maxWidth: "min(94vw, 720px)" }}
              initial={{ scale: 0.94, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/95 border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden">
                <CardContent className="p-7 md:p-10 grid gap-6 text-center">
                  <motion.div
                    className="w-20 h-20 mx-auto rounded-full bg-cyan-400/10 border border-cyan-300/50 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    animate={{ boxShadow: ["0 0 0px rgba(34,211,238,0.1)", "0 0 26px rgba(34,211,238,0.36)", "0 0 0px rgba(34,211,238,0.1)"] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  >
                    <Sparkles className="w-10 h-10 text-cyan-300" />
                  </motion.div>

                  <div className="grid gap-2">
                    <p className="text-cyan-300 font-semibold uppercase text-sm tracking-[0.24em]">Opening Transmission</p>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                      THE AUSUM REALM
                    </h2>
                  </div>

                  <div className="grid gap-3 max-w-2xl mx-auto min-h-[330px] md:min-h-[300px] place-items-center">
                    {introStoryLines.slice(0, visibleIntroLines).map((line, index) => {
                      const isNewest = index === visibleIntroLines - 1;
                      const isFinalReveal = index === introStoryLines.length - 1;

                      return (
                        <motion.div
                          key={line}
                          className={`w-full max-w-xl rounded-2xl border px-4 py-3 md:px-5 md:py-4 text-center font-bold leading-relaxed tracking-wide ${
                            isFinalReveal
                              ? "bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border-cyan-300/70 text-white text-xl md:text-2xl shadow-[0_0_28px_rgba(34,211,238,0.22)]"
                              : isNewest
                              ? "bg-cyan-950/50 border-cyan-400/60 text-cyan-50 text-base md:text-lg shadow-[0_0_20px_rgba(34,211,238,0.16)]"
                              : "bg-slate-950/55 border-slate-700/60 text-slate-300 text-sm md:text-base opacity-80"
                          }`}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.45 }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${isFinalReveal ? "bg-cyan-200" : isNewest ? "bg-cyan-300" : "bg-slate-500"}`} />
                            <span>{line}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="min-h-16 flex items-center justify-center">
                    {introReady ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Button
                          onClick={() => {
                            setShowIntro(false);
                            setMessage("The first gate is waiting.");
                          }}
                          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-black text-xl min-h-16 px-10 shadow-lg shadow-cyan-500/40"
                        >
                          LET&apos;S GO
                        </Button>
                      </motion.div>
                    ) : (
                      <p className="text-slate-400 text-sm md:text-base">Auri is transmitting...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "missionComplete" && modalData.mission && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mx-auto"
              style={{ width: "min(94vw, 560px)" }}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
            >
              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-cyan-700/40 rounded-2xl shadow-2xl">
                <CardContent className="p-7 md:p-8 grid gap-5">
                  <h3 className="text-2xl md:text-3xl font-bold text-cyan-300">
                    {modalData.energyEarned === modalData.mission.reward && modalData.xpEarned === modalData.mission.xpReward
                      ? "Mission Mastered"
                      : "Mission Completed"}
                  </h3>

                  <div className="grid gap-3 text-slate-100 text-base md:text-lg leading-relaxed">
                    <p>
                      Completion:{" "}
                      {modalData.energyEarned === modalData.mission.reward && modalData.xpEarned === modalData.mission.xpReward ? (
                        <span className="font-bold text-emerald-300">Mastered</span>
                      ) : (
                        <span className="font-bold text-cyan-300">Completed</span>
                      )}
                    </p>
                    <p>
                      Energy earned: <span className="font-bold text-yellow-300">+{modalData.energyEarned}</span>
                    </p>
                    <p>
                      XP earned: <span className="font-bold text-cyan-300">+{modalData.xpEarned}</span>
                    </p>
                    <p>
                      Skill practiced: <span className="font-bold text-emerald-300">{modalData.mission.skill}</span>
                    </p>
                    <p>
                      Rank:{" "}
                      <span className="font-bold text-purple-300">
                        {modalData.rankUp ? `Rank Up! ${modalData.rank}` : modalData.rank}
                      </span>
                    </p>
                    <p className="rounded-2xl bg-slate-950/70 border border-slate-700 p-4 text-slate-200">
                      {modalData.mission.explanation}
                    </p>
                  </div>

                  <Button
                    onClick={continueMissionComplete}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-lg min-h-14 shadow-lg shadow-cyan-500/40"
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "incorrectAdvance" && modalData.mission && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mx-auto"
              style={{ width: "min(94vw, 560px)" }}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
            >
              <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-amber-600/40 rounded-2xl shadow-2xl">
                <CardContent className="p-7 md:p-8 grid gap-5">
                  <h3 className="text-2xl md:text-3xl font-bold text-amber-300">Not Quite</h3>

                  <div className="grid gap-3 text-slate-100 text-base md:text-lg leading-relaxed">
                    <p>
                      That answer was incorrect. This mission will be marked as assisted, and we’ll keep moving forward.
                    </p>
                    <p>
                      Completion: <span className="font-bold text-amber-300">Assisted</span>
                    </p>
                    <p>
                      Energy earned: <span className="font-bold text-yellow-300">+0</span>
                    </p>
                    <p>
                      XP earned: <span className="font-bold text-cyan-300">+0</span>
                    </p>
                    <p>
                      Current rank: <span className="font-bold text-purple-300">{modalData.rank}</span>
                    </p>
                    <p>
                      Streak: <span className="font-bold text-rose-300">Reset</span>
                    </p>
                    <p>
                      Skill practiced: <span className="font-bold text-emerald-300">{modalData.mission.skill}</span>
                    </p>
                    <p className="rounded-2xl bg-slate-950/70 border border-slate-700 p-4 text-slate-200">
                      The correct answer was: <span className="font-bold text-cyan-300">{modalData.correctAnswer}</span>
                    </p>
                  </div>

                  <Button
                    onClick={continueIncorrectAdvance}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-lg min-h-14 shadow-lg shadow-cyan-500/40"
                  >
                    Continue to Next Mission
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "worldComplete" && modalData.completedWorldTitle && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative mx-auto w-full"
              style={{ maxWidth: "min(94vw, 600px)" }}
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
            >
              <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/95 border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden">
                <CardContent className="p-8 md:p-10 grid gap-6 text-center">
                  <Trophy className="w-16 h-16 text-cyan-300 mx-auto" />
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-cyan-300">
                    {modalData.completedWorldTitle} Restored!
                  </h2>
                  <p className="text-slate-300 text-base md:text-lg">
                    A new path has opened in The Ausum Realm.
                  </p>
                  <Button
                    onClick={continueWorldComplete}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-lg min-h-14 px-6 shadow-lg shadow-cyan-500/40"
                  >
                    Continue Adventure
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto grid gap-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 shadow-lg shadow-indigo-500/50">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              AUSUM Quest
            </h1>
            <p className="text-slate-300 text-base md:text-lg">
              A thinking adventure built for challenge, confidence, and discovery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard icon={<Zap className="w-8 h-8 text-yellow-300" />} label="Energy" value={energy} color="text-yellow-300" />
          <StatCard icon={<Shield className="w-8 h-8 text-cyan-300" />} label="Level" value={level} color="text-cyan-300" />
          <StatCard icon={<Star className="w-8 h-8 text-purple-300" />} label="Rank" value={currentRank} color="text-purple-300" />
          <StatCard icon={<Trophy className="w-8 h-8 text-cyan-300" />} label="XP" value={xp} color="text-cyan-300" />
          <StatCard icon={<Flame className="w-8 h-8 text-orange-400" />} label="Streak" value={streak} color="text-orange-300" />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => setSoundEnabled((prev) => !prev)}
            variant="outline"
            className="rounded-2xl border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:border-slate-400 font-bold"
          >
            Sound {soundEnabled ? "On" : "Off"}
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <CardContent className="p-6 grid gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <Map className="w-6 h-6 text-cyan-300" /> World Map
              </h3>
              <p className="text-slate-300 text-sm">XP to next level: {LEVEL_XP - (xp % LEVEL_XP)}</p>
            </div>

            <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${xpFill}%` }}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {worldProgress.map((world) => (
                <div
                  key={world.id}
                  role="button"
                  tabIndex={world.unlocked ? 0 : -1}
                  onClick={() => focusWorld(world.id, world.unlocked)}
                  className={`rounded-2xl border p-4 transition-all ${
                    world.unlocked
                      ? "bg-slate-900/70 border-cyan-700/40 cursor-pointer"
                      : "bg-slate-900/30 border-slate-700/40 opacity-60"
                  } ${
                    world.active || selectedWorldId === world.id
                      ? "ring-1 ring-cyan-400/60 shadow-[0_0_22px_rgba(34,211,238,0.16)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">{world.title}</h4>
                    <span className={`text-xs font-semibold ${world.restored ? "text-emerald-300" : world.unlocked ? "text-cyan-300" : "text-slate-500"}`}>
                      {world.restored ? "Restored" : world.active ? "Active" : world.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{world.description}</p>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${world.percent}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mb-1">
                    Progress: {world.completedCount}/{world.missions.length}
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    Mastered: {world.masteredCount} • Completed: {world.completedCorrectCount} • Assisted: {world.assistedCount}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {world.missions.map((mission) => {
                      const status = getMissionStatus(mission);
                      return (
                        <div
                          key={mission.id}
                          title={status}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold ${
                            status === "mastered"
                              ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                              : status === "completed"
                              ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                              : status === "assisted"
                              ? "bg-amber-500/20 border-amber-400 text-amber-200"
                              : status === "current"
                              ? "bg-cyan-500/20 border-cyan-300 text-cyan-100"
                              : status === "locked"
                              ? "bg-slate-800/50 border-slate-700 text-slate-500"
                              : "bg-slate-700/50 border-slate-500 text-slate-200"
                          }`}
                        >
                          {status === "mastered" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : status === "completed" ? (
                            <Shield className="w-4 h-4" />
                          ) : status === "assisted" ? (
                            <LifeBuoy className="w-4 h-4" />
                          ) : status === "locked" ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            mission.id
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {gameComplete ? (
          <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/95 border-emerald-500/30 rounded-3xl shadow-2xl">
            <CardContent className="p-8 md:p-10 grid gap-6 text-center">
              <Sparkles className="w-20 h-20 text-emerald-300 mx-auto" />
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-emerald-300">
                The Ausum Realm Has Been Restored
              </h2>
              <p className="text-slate-300 text-base md:text-lg">
                You completed every world and brought the quest to a close.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
                <div className="rounded-2xl bg-slate-950/70 border border-emerald-700/40 p-4">
                  <p className="text-slate-400 text-sm">Mastered Missions</p>
                  <p className="text-2xl font-bold text-emerald-300">{masteredCompleted.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 border border-amber-700/40 p-4">
                  <p className="text-slate-400 text-sm">Completed Missions</p>
                  <p className="text-2xl font-bold text-cyan-300">{completedCorrect.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 border border-amber-700/40 p-4">
                  <p className="text-slate-400 text-sm">Assisted Missions</p>
                  <p className="text-2xl font-bold text-amber-300">{assistedCompleted.length}</p>
                </div>
              </div>
              <Button
                onClick={restartQuest}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-bold text-lg min-h-14 px-6 mx-auto"
              >
                Restart Quest
              </Button>
            </CardContent>
          </Card>
        ) : currentMission ? (
          <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              <CardContent className="p-6 grid gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-cyan-300 font-semibold uppercase text-sm tracking-wider">{currentMission.type}</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">{currentMission.title}</h2>
                  </div>
                  <div className="text-right text-sm text-slate-400 bg-slate-950/50 px-3 py-2 rounded-xl">
                    Mission {completed.length + 1} of {missions.length}
                  </div>
                </div>

                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                <div
                  className={`rounded-2xl bg-slate-950/80 p-5 border ${
                    flashAnswerArea ? "border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : "border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-cyan-300 mt-1 flex-shrink-0" />
                    <p className="text-lg leading-relaxed text-white">{currentMission.prompt}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {currentMission.choices.map((choice) => {
                    const isCorrect = selected === choice && choice === currentMission.answer;
                    const isWrong = wrongChoice === choice;
                    return (
                      <Button
                        key={choice}
                        onClick={() => chooseAnswer(choice)}
                        disabled={activeModal !== null}
                        className={`min-h-16 rounded-2xl text-lg font-semibold justify-start px-5 w-full transition-all ${
                          isCorrect
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : isWrong
                            ? "bg-rose-500 hover:bg-rose-600 text-white"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        {choice}
                      </Button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={restartQuest}
                    variant="outline"
                    className="rounded-2xl border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:border-slate-400 font-bold text-lg min-h-14 px-6"
                  >
                    Restart Quest
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl">
                <CardContent className="p-6 grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center font-black text-2xl">
                      A
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Auri</h3>
                      <p className="text-slate-400 text-sm">Quest Companion</p>
                    </div>
                  </div>
                  <p className="text-lg text-slate-100 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-700/50">
                    {message}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl">
                <CardContent className="p-6 grid gap-4">
                  <div className="flex items-center gap-2">
                    <Map className="w-6 h-6 text-cyan-300" />
                    <h3 className="text-xl font-bold text-white">Zone Progress</h3>
                  </div>
                  <div className="grid gap-3 max-h-[520px] overflow-y-auto pr-1">
                    {missions.map((mission) => {
                      const status = getMissionStatus(mission);
                      return (
                        <div
                          key={mission.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-2xl ${
                            status === "mastered"
                              ? "bg-emerald-900/30 border border-emerald-700/50"
                              : status === "completed"
                              ? "bg-cyan-900/25 border border-cyan-600/50"
                              : status === "assisted"
                              ? "bg-amber-900/25 border border-amber-600/50"
                              : status === "current"
                              ? "bg-cyan-900/25 border border-cyan-500/50"
                              : status === "unlocked"
                              ? "bg-slate-900/80 border border-slate-600/60"
                              : "bg-slate-950/60 border border-slate-800/60 opacity-55"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-white">{mission.title}</p>
                            <p className="text-sm text-slate-400">{mission.skill}</p>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              status === "mastered"
                                ? "text-emerald-300"
                                : status === "completed"
                                ? "text-cyan-300"
                                : status === "assisted"
                                ? "text-amber-300"
                                : status === "current"
                                ? "text-cyan-300"
                                : status === "unlocked"
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}
                          >
                            {status === "mastered"
                              ? "Mastered"
                              : status === "completed"
                              ? "Completed"
                              : status === "assisted"
                              ? "Assisted"
                              : status === "current"
                              ? "Current"
                              : status === "unlocked"
                              ? "Unlocked"
                              : "Locked"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl">
                <CardContent className="p-6 flex items-start gap-3">
                  <Volume2 className="w-6 h-6 text-cyan-300 mt-1 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">
                    Voice missions are represented in this prototype. The next build can add real speech recognition, spoken prompts, and pronunciation feedback.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className={`text-lg md:text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
