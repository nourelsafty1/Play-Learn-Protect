import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { monitoringAPI } from '../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const GamePlayer = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const childId = searchParams.get('child');
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gameData = {
    physics: {
      title: "Physics Lab",
      questions: [
        { q: "What pulls apples down?", options: ["Gravity", "Magic", "Wind"], a: "Gravity" },
        { q: "Unit of Force?", options: ["Newton", "Watt", "Joule"], a: "Newton" },
        { q: "Speed = ?", options: ["Dist/Time", "Mass*Acc", "Energy"], a: "Dist/Time" }
      ]
    },
    chemistry: {
      title: "Chemistry Mix",
      questions: [
        { q: "H2O is?", options: ["Water", "Gold", "Salt"], a: "Water" },
        { q: "Atomic symbol for Gold?", options: ["Au", "Ag", "Fe"], a: "Au" },
        { q: "Oxygen is a?", options: ["Gas", "Metal", "Liquid"], a: "Gas" }
      ]
    },
    english: {
      title: "Story Builder",
      questions: [
        { q: "Opposite of Hot?", options: ["Cold", "Warm", "Fire"], a: "Cold" },
        { q: "Plural of Cat?", options: ["Cats", "Cates", "Kitten"], a: "Cats" },
        { q: "Past tense of Run?", options: ["Ran", "Running", "Runs"], a: "Ran" }
      ]
    }
  };

  const currentGame = gameData[gameId] || gameData.physics;
  const currentQuestion = currentGame.questions[questionIndex];

  const handleAnswer = (answer) => {
    if (answer === currentQuestion.a) {
      setScore(score + 10);
      toast.success("Correct!", { icon: '🌟' });
    } else {
      toast.error("Try again!");
    }

    if (questionIndex + 1 < currentGame.questions.length) {
      setQuestionIndex(questionIndex + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameOver(true);
    if (sessionId) {
      try {
        await monitoringAPI.addActivity(sessionId, {
          activityType: 'game',
          gameId: gameId,
          duration: 60,
          score: score,
          completed: true
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-slate-800 p-12 rounded-3xl text-center border-4 border-yellow-400">
          <h1 className="text-5xl font-bold text-yellow-400 mb-6">Mission Complete!</h1>
          <p className="text-3xl mb-8">Score: {score}</p>
          <button onClick={() => navigate(`/play/${childId}`)} className="bg-green-500 px-8 py-4 rounded-full text-xl font-bold">Return to Base</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <button onClick={() => navigate(`/play/${childId}`)} className="flex items-center gap-2 mb-8"><FaArrowLeft /> Back</button>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{currentGame.title}</h1>
        <p className="text-xl mb-8 text-yellow-400">Score: {score}</p>
        <motion.div key={questionIndex} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-800 p-8 rounded-3xl">
          <h2 className="text-3xl font-semibold mb-12 text-center">{currentQuestion.q}</h2>
          <div className="grid grid-cols-3 gap-6">
            {currentQuestion.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} className="bg-slate-700 hover:bg-indigo-600 py-6 px-4 rounded-xl text-xl font-medium">
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GamePlayer;