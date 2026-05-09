import { useMemo, useState } from "react";
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
};

type World = {
  id: number;
  title: string;
  description: string;
};

const LEVEL_XP = 100;

const worlds: World[] = [
  {
    id: 1,
    title: "Crystal Valley",
    description: "Warm up logic and pattern skills to power the valley gates.",
  },
  {
    id: 2,
    title: "Signal City",
    description: "Decode language clues and clear communication missions.",
  },
  {
    id: 3,
    title: "Shadow Forest",
    description: "Use focus and confidence to complete final support missions.",
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
  },
  {
    id: 2,
    worldId: 1,
    title: "Decode the Signal",
    type: "Reading Mission",
    prompt:
      "Choose the word that best completes the sentence: The explorer was brave because he kept going even when he felt __.",
    choices: ["hungry", "afraid", "sleepy", "quiet"],
    answer: "afraid",
    reward: 25,
    xpReward: 40,
    skill: "Inference",
  },
  {
    id: 3,
    worldId: 2,
    title: "Charge the Crystal",
    type: "Math Mission",
    prompt: "The crystal needs 12 energy points. You already have 7. How many more do you need?",
    choices: ["3", "4", "5", "6"],
    answer: "5",
    reward: 20,
    xpReward: 35,
    skill: "Subtraction",
  },
  {
    id: 4,
    worldId: 3,
    title: "Speak the Command",
    type: "Voice Mission",
    prompt: "Say or choose the command that would help a teammate: 'I need help, please.'",
    choices: ["Go away", "I need help, please", "That is mine", "Stop talking"],
    answer: "I need help, please",
    reward: 30,
    xpReward: 45,
    skill: "Functional communication",
  },
];

const companionMessages = {
  start: "Welcome to AUSUM Quest. The world of Lumora needs your thinking power.",
  correct: "Excellent! You powered the quest and earned rewards.",
  incorrect: "Good try. Check the clue, slow down, and try again.",
  complete: "Mission chain complete. You restored the first zone!",
};

function getRankForXp(xp: number) {
  if (xp >= 600) return "Lumora Legend";
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

export default function AusumQuestPrototype() {
  const [missionIndex, setMissionIndex] = useState(0);
  const [selectedWorldId, setSelectedWorldId] = useState(worlds[0].id);
  const [energy, setEnergy] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState(companionMessages.start);
  const [selected, setSelected] = useState<string | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [unlockFlashWorldId, setUnlockFlashWorldId] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<null | "missionComplete" | "worldComplete" | "gameComplete">(null);
  const [modalData, setModalData] = useState<{
    missionComplete?: {
      energyEarned: number;
      xpEarned: number;
      skill: string;
      currentRank: string;
      rankUp: boolean;
      newRank?: string;
    };
    worldComplete?: {
      worldId: number;
      title: string;
      energyEarned: number;
      xpEarned: number;
      currentRank: string;
      particles: Array<{ id: number; x: number; y: number; size: number; delay: number }>;
    };
  }>({});

  const currentMission = missions[missionIndex];
  const currentWorldId = currentMission.worldId;
  const progress = Math.round((completed.length / missions.length) * 100);
  const xpProgress = Math.round(((xp % LEVEL_XP) / LEVEL_XP) * 100);
  const xpFill = xp > 0 ? Math.max(6, xpProgress) : 0;
  const highestUnlockedMissionId = Math.min(missions.length, completed.length + 1);
  const currentRank = useMemo(() => getRankForXp(xp), [xp]);

  const rank = currentRank;

  const worldProgress = worlds.map((world, index) => {
    const worldMissions = missions.filter((mission) => mission.worldId === world.id);
    const worldCompleted = worldMissions.filter((mission) => completed.includes(mission.id)).length;
    const percent = Math.round((worldCompleted / worldMissions.length) * 100);
    const unlocked = index === 0 || (index > 0 && worldProgressCanUnlock(index));

    return {
      ...world,
      missions: worldMissions,
      completedCount: worldCompleted,
      percent,
      unlocked,
    };
  });

  function getMissionStatus(mission: Mission): "complete" | "current" | "unlocked" | "locked" {
    if (completed.includes(mission.id)) return "complete";
    if (mission.id === currentMission.id) return "current";

    const worldIndex = worlds.findIndex((world) => world.id === mission.worldId);
    const worldUnlocked = worldIndex === 0 || worldProgressCanUnlock(worldIndex);
    const reached = mission.id <= highestUnlockedMissionId;

    if (worldUnlocked && reached) return "unlocked";
    return "locked";
  }

  function worldProgressCanUnlock(worldIndex: number) {
    const previousWorld = worlds[worldIndex - 1];
    const previousWorldMissions = missions.filter((mission) => mission.worldId === previousWorld.id);
    return previousWorldMissions.every((mission) => completed.includes(mission.id));
  }

  function focusWorld(worldId: number, unlocked: boolean) {
    if (!unlocked) return;
    setSelectedWorldId(worldId);
  }

  function createCelebrationParticles() {
    return Array.from({ length: 14 }, () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.8,
    }));
  }

  function generateParticles() {
    const newParticles = Array.from({ length: 8 }, () => ({
      id: Math.random(),
      x: Math.random() * 160 - 80,
      y: Math.random() * 160 - 80,
    }));
    setParticles(newParticles);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 650);
  }

  function getNextWorldId(worldId: number) {
    const currentIndex = worlds.findIndex((world) => world.id === worldId);
    return worlds[currentIndex + 1]?.id ?? null;
  }

  function playCompletionSoundPlaceholder(worldTitle: string) {
    console.log(`[AUSUM Quest] completion sound placeholder: ${worldTitle}`);
  }

  function chooseAnswer(choice: string) {
    setSelected(choice);
    if (choice === currentMission.answer) {
      const newEnergy = energy + currentMission.reward;
      const newXp = xp + currentMission.xpReward;
      const newLevel = Math.floor(newXp / LEVEL_XP) + 1;
      const newStreak = streak + 1;
      const currentWorldMissions = missions.filter((mission) => mission.worldId === currentMission.worldId);
      const worldCompletedNow = currentWorldMissions.every(
        (mission) => mission.id === currentMission.id || completed.includes(mission.id)
      );

      setEnergy(newEnergy);
      setXp(newXp);
      setLevel(newLevel);
      setStreak(newStreak);
      setCompleted((prev) => [...new Set([...prev, currentMission.id])]);
      generateParticles();

      let successMessage = companionMessages.correct;
      if (newStreak === 2) successMessage = "Great momentum. Keep the streak going.";
      if (newStreak === 3) successMessage = "Excellent streak. You are focused and steady.";
      if (newStreak >= 4) successMessage = "Legend streak. Your focus is outstanding.";

      setMessage(successMessage);
      
      const previousRank = getRankForXp(xp);
      const newRankAfterMission = getRankForXp(newXp);
      const rankUp = newRankAfterMission !== previousRank || completed.length === 0;
      
      if (worldCompletedNow) {
        // Show world completion first
        const particlesForCelebration = createCelebrationParticles();
        setModalData({
          worldComplete: {
            worldId: currentMission.worldId,
            title: getWorldTitle(currentMission.worldId),
            energyEarned: currentMission.reward,
            xpEarned: currentMission.xpReward,
            currentRank: newRankAfterMission,
            particles: particlesForCelebration,
          },
        });
        setActiveModal("worldComplete");
        playCompletionSoundPlaceholder(getWorldTitle(currentMission.worldId));
      } else {
        // Show mission completion
        setModalData({
          missionComplete: {
            energyEarned: currentMission.reward,
            xpEarned: currentMission.xpReward,
            skill: currentMission.skill,
            currentRank: newRankAfterMission,
            rankUp: rankUp,
            newRank: rankUp ? newRankAfterMission : undefined,
          },
        });
        setActiveModal("missionComplete");
      }
    } else {
      setStreak(0);
      setMessage(companionMessages.incorrect);
    }
  }

  function continueAdventureFromCelebration() {
    if (!modalData.worldComplete) return;

    setSelected(null);
    const nextWorldId = getNextWorldId(modalData.worldComplete.worldId);
    const nextWorldStartMission = missions.find((mission) => mission.worldId === nextWorldId);
    
    if (!nextWorldStartMission && nextWorldId === null) {
      setActiveModal("gameComplete");
      setMessage("Lumora has been completely restored!");
      return;
    }

    if (nextWorldStartMission) {
      setMissionIndex(missions.findIndex((mission) => mission.id === nextWorldStartMission.id));
      setSelectedWorldId(nextWorldId!);
      setMessage(`Adventure continues in ${getWorldTitle(nextWorldId!)}.`);
    }
  }

  function nextMission() {
    setSelected(null);
    setModalData({});
    if (missionIndex < missions.length - 1) {
      const nextIndex = missionIndex + 1;
      setMissionIndex(nextIndex);
      setSelectedWorldId(missions[nextIndex].worldId);
      setMessage("New mission unlocked. Read the clue carefully.");
    } else {
      setMessage(companionMessages.complete);
      setStreak(0);
    }
  }

  function restartQuest() {
    setMissionIndex(0);
    setSelectedWorldId(worlds[0].id);
    setEnergy(0);
    setXp(0);
    setLevel(1);
    setSelected(null);
    setCompleted([]);
    setStreak(0);
    setMessage(companionMessages.start);
    setUnlockFlashWorldId(null);
    setActiveModal(null);
    setModalData({});
  }

  function worldStatusLabel(world: World) {
    const worldMissions = missions.filter((mission) => mission.worldId === world.id);
    const worldCompleted = worldMissions.every((mission) => completed.includes(mission.id));
    const worldIndex = worlds.findIndex((candidate) => candidate.id === world.id);
    const unlocked = worldIndex === 0 || worldProgressCanUnlock(worldIndex);

    if (worldCompleted) return "Restored";
    if (world.id === currentWorldId) return "Active";
    if (unlocked) return "Unlocked";
    return "Locked";
  }

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
        {showParticles &&
          particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="fixed left-1/2 top-[40%] w-3 h-3 bg-yellow-400 rounded-full pointer-events-none"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "worldComplete" && modalData.worldComplete && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none max-w-6xl mx-auto">
              {modalData.worldComplete!.particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(34,211,238,0.6)]"
                  style={{ left: `${particle.x}%`, top: `${particle.y}%`, width: particle.size, height: particle.size }}
                  initial={{ opacity: 0, scale: 0.3, y: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.3, 1.15, 0.6], y: [0, -30, -60] }}
                  transition={{ duration: 2.2, delay: particle.delay, repeat: Infinity, repeatDelay: 0.2 }}
                />
              ))}
            </div>

            <motion.div
              className="relative mx-auto w-full"
              style={{ maxWidth: "min(94vw, 600px)" }}
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/95 border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden">
                <CardContent className="p-8 md:p-10 grid gap-6 text-center">
                  <motion.div
                    className="w-20 h-20 mx-auto rounded-full bg-cyan-400/10 border border-cyan-300/50 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    animate={{ boxShadow: ["0 0 0px rgba(34,211,238,0.1)", "0 0 24px rgba(34,211,238,0.38)", "0 0 0px rgba(34,211,238,0.1)"] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  >
                    <Trophy className="w-10 h-10 text-cyan-300" />
                  </motion.div>

                  <div className="grid gap-2">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-cyan-300">
                      {modalData.worldComplete!.title} Restored!
                    </h2>
                    <p className="text-slate-300 text-base md:text-lg">
                      The world has been stabilized. New paths are now available in Lumora.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 text-left">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">XP Earned</p>
                      <p className="text-2xl font-bold text-cyan-300">+{modalData.worldComplete!.xpEarned}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">Energy Earned</p>
                      <p className="text-2xl font-bold text-yellow-300">+{modalData.worldComplete!.energyEarned}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">Rank</p>
                      <p className="text-2xl font-bold text-purple-300">
                        {modalData.worldComplete!.currentRank}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={() => {
                        setActiveModal(null);
                        setModalData({});
                        continueAdventureFromCelebration();
                      }}
                      className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-lg min-h-14 px-6 shadow-lg shadow-cyan-500/40"
                    >
                      Continue Adventure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "gameComplete" && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-3xl"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/95 border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
                <CardContent className="p-8 md:p-10 grid gap-6 text-center">
                  <motion.div
                    className="w-24 h-24 mx-auto rounded-full bg-emerald-400/10 border border-emerald-300/40 flex items-center justify-center shadow-[0_0_36px_rgba(16,185,129,0.2)]"
                    animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0.1)", "0 0 24px rgba(16,185,129,0.35)", "0 0 0px rgba(16,185,129,0.1)"] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  >
                    <Sparkles className="w-12 h-12 text-emerald-300" />
                  </motion.div>

                  <div className="grid gap-2">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-emerald-300">
                      Lumora Has Been Restored
                    </h2>
                    <p className="text-slate-300 text-base md:text-lg">
                      You completed every world and brought the quest to a close.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3 text-left">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">Total XP</p>
                      <p className="text-2xl font-bold text-cyan-300">{xp}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">Energy</p>
                      <p className="text-2xl font-bold text-yellow-300">{energy}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">Level</p>
                      <p className="text-2xl font-bold text-cyan-300">{level}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4">
                      <p className="text-slate-400 text-sm">Streak</p>
                      <p className="text-2xl font-bold text-orange-300">{streak}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={restartQuest}
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-bold text-lg min-h-14 px-6 shadow-lg shadow-emerald-500/35"
                    >
                      Restart Quest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "missionComplete" && modalData.missionComplete && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
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
                  <motion.h3
                    className="text-2xl md:text-3xl font-bold text-cyan-300"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    Mission Complete
                  </motion.h3>
                  <div className="grid gap-3 text-slate-100 text-base md:text-lg leading-relaxed">
                    <p>
                      Energy earned: <span className="font-bold text-yellow-300">+{modalData.missionComplete.energyEarned}</span>
                    </p>
                    <p>
                      XP earned: <span className="font-bold text-cyan-300">+{modalData.missionComplete.xpEarned}</span>
                    </p>
                    <p>
                      Skill practiced: <span className="font-bold text-emerald-300">{modalData.missionComplete.skill}</span>
                    </p>
                    <p>
                      Rank: <span className="font-bold text-purple-300">{modalData.missionComplete.rankUp ? `${modalData.missionComplete.newRank} ⬆️` : modalData.missionComplete.currentRank}</span>
                    </p>
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        setActiveModal(null);
                        setModalData({});
                        nextMission();
                      }}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-lg min-h-14 shadow-lg shadow-cyan-500/40"
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto grid gap-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 rounded-2xl bg-indigo-500/20 shadow-lg shadow-indigo-500/50"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                AUSUM Quest
              </h1>
              <p className="text-slate-300 text-base md:text-lg">
                A thinking adventure built for challenge, confidence, and discovery.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border-yellow-700/50 rounded-2xl shadow-xl hover:shadow-yellow-500/20 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <Zap className="w-8 h-8 text-yellow-300 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-sm">Energy</p>
                <motion.p
                  className="text-2xl font-bold text-yellow-300"
                  key={energy}
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 0.25 }}
                >
                  {energy}
                </motion.p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-900/20 border-cyan-700/50 rounded-2xl shadow-xl hover:shadow-cyan-500/20 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <Shield className="w-8 h-8 text-cyan-300 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-sm">Level</p>
                <motion.p
                  className="text-2xl font-bold text-cyan-300"
                  key={level}
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 0.25 }}
                >
                  {level}
                </motion.p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border-purple-700/50 rounded-2xl shadow-xl hover:shadow-purple-500/20 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <Star className="w-8 h-8 text-purple-300 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-sm">Rank</p>
                <p className="text-lg font-bold text-purple-300">{rank}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky-900/40 to-cyan-900/20 border-sky-700/50 rounded-2xl shadow-xl hover:shadow-cyan-500/20 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <Trophy className="w-8 h-8 text-cyan-300 flex-shrink-0" />
              <div className="w-full">
                <p className="text-slate-400 text-sm">XP</p>
                <p className="text-lg font-bold text-cyan-300">{xp}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/20 border-orange-700/50 rounded-2xl shadow-xl hover:shadow-orange-500/20 transition-shadow h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <Flame className={`w-8 h-8 text-orange-400 flex-shrink-0 ${streak > 0 ? "animate-bounce" : ""}`} />
              <div>
                <p className="text-slate-400 text-sm">Streak</p>
                <p className="text-2xl font-bold text-orange-300">{streak}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                className="h-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.45)] transition-all duration-500 ease-out"
                style={{ width: `${xpFill}%` }}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {worldProgress.map((world, worldIndex) => (
                <div
                  key={world.id}
                  role="button"
                  tabIndex={world.unlocked ? 0 : -1}
                  onClick={() => focusWorld(world.id, world.unlocked)}
                  onKeyDown={(event) => {
                    if (world.unlocked && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      focusWorld(world.id, world.unlocked);
                    }
                  }}
                  className={`rounded-2xl border p-4 transition-all ${
                    world.unlocked
                      ? "bg-slate-900/70 border-cyan-700/40 cursor-pointer"
                      : "bg-slate-900/30 border-slate-700/40 opacity-60"
                  } ${
                    unlockFlashWorldId === world.id
                      ? "ring-2 ring-cyan-300/80 shadow-[0_0_28px_rgba(34,211,238,0.3)]"
                      : selectedWorldId === world.id || currentWorldId === world.id
                      ? "ring-1 ring-cyan-400/60 shadow-[0_0_22px_rgba(34,211,238,0.16)]"
                      : "hover:border-cyan-600/40"
                  }`}
                  aria-label={`${world.title} world`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">{world.title}</h4>
                    <span className={`text-xs font-semibold ${worldStatusLabel(world) === "Restored" ? "text-emerald-300" : world.unlocked ? "text-cyan-300" : "text-slate-500"}`}>
                      {worldStatusLabel(world)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{world.description}</p>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      animate={{ width: `${world.percent}%` }}
                      transition={{ duration: 0.35 }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Progress: {world.completedCount}/{world.missions.length}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {world.missions.map((mission, missionNodeIndex) => {
                      const isCompleted = completed.includes(mission.id);
                      const isCurrent = currentMission.id === mission.id && !isCompleted;
                      const isLocked = !world.unlocked || mission.id > highestUnlockedMissionId;
                      const hasConnector = missionNodeIndex < world.missions.length - 1;
                      const nextMission = world.missions[missionNodeIndex + 1];
                      const nextCompleted = nextMission ? completed.includes(nextMission.id) : false;
                      const connectorActive = isCompleted || nextCompleted;

                      return (
                        <div key={mission.id} className="flex items-center gap-2">
                          <motion.div
                            className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                                : isLocked
                                ? "bg-slate-800/50 border-slate-700 text-slate-500"
                                : "bg-cyan-500/15 border-cyan-400 text-cyan-200"
                            }`}
                            animate={
                              isCurrent
                                ? { boxShadow: ["0 0 0px #22d3ee", "0 0 14px #22d3ee", "0 0 0px #22d3ee"] }
                                : {}
                            }
                            transition={{ duration: 1.2, repeat: isCurrent ? Infinity : 0 }}
                          >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3 h-3" /> : mission.id}
                          </motion.div>
                          {hasConnector && (
                            <motion.div
                              className={`h-[2px] w-8 rounded-full ${
                                connectorActive
                                  ? "bg-gradient-to-r from-emerald-300/70 to-cyan-300/70"
                                  : "bg-slate-700/70"
                              }`}
                              animate={connectorActive ? { opacity: [0.45, 0.85, 0.45] } : { opacity: 0.5 }}
                              transition={{ duration: 1.6, repeat: Infinity }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {worldIndex < worlds.length - 1 && <div className="mt-3 h-px bg-slate-700/50" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
          <motion.div key={currentMission.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden hover:shadow-cyan-500/10 transition-shadow">
              <CardContent className="p-6 grid gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-cyan-300 font-semibold uppercase text-sm tracking-wider">{currentMission.type}</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">{currentMission.title}</h2>
                  </div>
                  <motion.div
                    className="text-right text-sm text-slate-400 bg-slate-950/50 px-3 py-2 rounded-xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Mission {missionIndex + 1} of {missions.length}
                  </motion.div>
                </div>

                <motion.div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>

                <div className="rounded-2xl bg-slate-950/80 p-5 border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-cyan-300 mt-1 flex-shrink-0" />
                    <p className="text-lg leading-relaxed text-white">{currentMission.prompt}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {currentMission.choices.map((choice) => {
                    const isCorrect = selected !== null && choice === currentMission.answer;
                    const isWrong = selected === choice && choice !== currentMission.answer;
                    return (
                      <motion.div key={choice} layout>
                        <Button
                          onClick={() => chooseAnswer(choice)}
                          disabled={selected !== null}
                          className={`min-h-16 rounded-2xl text-lg font-semibold justify-start px-5 w-full transition-all ${
                            isCorrect
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/50"
                              : isWrong
                              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/50"
                              : "bg-slate-700 hover:bg-slate-600 text-white"
                          }`}
                        >
                          <motion.div
                            animate={isCorrect ? { scale: [1, 1.05, 1] } : isWrong ? { x: [-5, 5, -5, 0] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {choice}
                          </motion.div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={nextMission}
                      disabled={activeModal !== null}
                      className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-lg min-h-14 px-6 shadow-lg shadow-cyan-500/50 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Next Mission
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={restartQuest}
                      variant="outline"
                      className="rounded-2xl border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:border-slate-400 font-bold text-lg min-h-14 px-6"
                    >
                      Restart Quest
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl hover:shadow-indigo-500/10 transition-shadow">
                <CardContent className="p-6 grid gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center font-black text-2xl shadow-lg shadow-cyan-500/50"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      A
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Auri</h3>
                      <p className="text-slate-400 text-sm">Quest Companion</p>
                    </div>
                  </div>
                  <motion.p
                    className="text-lg text-slate-100 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-700/50"
                    key={message}
                    animate={{ opacity: [0.8, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {message}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl shadow-2xl">
                <CardContent className="p-6 grid gap-4">
                  <div className="flex items-center gap-2">
                    <Map className="w-6 h-6 text-cyan-300" />
                    <h3 className="text-xl font-bold text-white">Zone Progress</h3>
                  </div>
                  <div className="grid gap-3">
                    {missions.map((mission) => {
                      const status = getMissionStatus(mission);
                      const isComplete = status === "complete";
                      const isCurrent = status === "current";
                      const isUnlocked = status === "unlocked";
                      return (
                        <motion.div
                          key={mission.id}
                          layout
                          className={`flex items-center justify-between gap-3 p-3 rounded-2xl transition-all ${
                            isComplete
                              ? "bg-emerald-900/30 border border-emerald-700/50"
                              : isCurrent
                              ? "bg-cyan-900/25 border border-cyan-500/50 shadow-[0_0_18px_rgba(34,211,238,0.2)]"
                              : isUnlocked
                              ? "bg-slate-900/80 border border-slate-600/60"
                              : "bg-slate-950/60 border border-slate-800/60 opacity-55"
                          }`}
                          animate={isCurrent ? { boxShadow: ["0 0 0px rgba(34,211,238,0)", "0 0 20px rgba(34,211,238,0.22)", "0 0 0px rgba(34,211,238,0)"] } : {}}
                          transition={{ duration: 1.4, repeat: isCurrent ? Infinity : 0 }}
                        >
                          <div>
                            <p className="font-semibold text-white">{mission.title}</p>
                            <p className="text-sm text-slate-400">{mission.skill}</p>
                          </div>
                          <motion.span
                            className={`text-sm font-bold ${
                              isComplete
                                ? "text-emerald-300"
                                : isCurrent
                                ? "text-cyan-300"
                                : isUnlocked
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}
                            animate={isComplete ? { scale: [1, 1.18, 1] } : isCurrent ? { scale: [1, 1.08, 1] } : {}}
                            transition={{ duration: 0.35, repeat: isCurrent ? Infinity : 0, repeatDelay: 1.2 }}
                          >
                            {isComplete ? (
                              "Complete"
                            ) : isCurrent ? (
                              "Current"
                            ) : isUnlocked ? (
                              "Unlocked"
                            ) : (
                              <span className="flex items-center gap-1">
                                <Lock className="w-4 h-4" /> Locked
                              </span>
                            )}
                          </motion.span>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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
      </div>
    </div>
  );
}
