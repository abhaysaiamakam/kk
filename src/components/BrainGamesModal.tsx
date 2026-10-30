import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChime } from '../utils/audio';

interface BrainGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CardItem {
  id: number;
  icon: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const INITIAL_CARDS: { icon: string; name: string }[] = [
  { icon: '🪷', name: 'Lotus' },
  { icon: '🥭', name: 'Mango' },
  { icon: '🦚', name: 'Peacock' },
  { icon: '☀️', name: 'Sun' },
];

export const BrainGamesModal: React.FC<BrainGamesModalProps> = ({ isOpen, onClose }) => {
  const [activeGame, setActiveGame] = useState<'memory' | 'quiz'>('memory');
  
  // Memory Game State
  const generateDeck = (): CardItem[] => {
    const doubled = [...INITIAL_CARDS, ...INITIAL_CARDS];
    // Shuffle
    const shuffled = doubled.sort(() => Math.random() - 0.5);
    return shuffled.map((item, index) => ({
      id: index,
      icon: item.icon,
      name: item.name,
      isFlipped: false,
      isMatched: false
    }));
  };

  const [cards, setCards] = useState<CardItem[]>(generateDeck);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // Quiz Game State
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || selectedCards.length === 2) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newSelected;
      if (cards[firstIdx].name === cards[secondIdx].name) {
        // Match!
        playChime();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);
          const nextCount = matchesCount + 1;
          setMatchesCount(nextCount);
          if (nextCount === INITIAL_CARDS.length) {
            setIsWon(true);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  const resetMemoryGame = () => {
    setCards(generateDeck());
    setSelectedCards([]);
    setMatchesCount(0);
    setMoves(0);
    setIsWon(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-6 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              Brain Activities
            </h2>
          </div>
          <button
            onClick={resetMemoryGame}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-[#F8F7F0] rounded-2xl border border-gray-200 my-4">
          <button
            onClick={() => setActiveGame('memory')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeGame === 'memory' ? 'bg-white text-[#263238] shadow-xs' : 'text-gray-500'
            }`}
          >
            Memory Match Cards
          </button>
          <button
            onClick={() => setActiveGame('quiz')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeGame === 'quiz' ? 'bg-white text-[#263238] shadow-xs' : 'text-gray-500'
            }`}
          >
            Gentle Trivia
          </button>
        </div>

        {/* Game 1: Memory Cards */}
        {activeGame === 'memory' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-3">
              <span>Moves: <strong className="text-[#263238]">{moves}</strong></span>
              <span>Matched: <strong className="text-[#2D4F3B]">{matchesCount} / {INITIAL_CARDS.length}</strong></span>
            </div>

            {isWon ? (
              <div className="py-10 text-center space-y-3 bg-[#EEF6FB] rounded-3xl p-6 border border-[#A0CDE8]">
                <div className="w-16 h-16 rounded-full bg-[#A8C9B0] text-white flex items-center justify-center mx-auto shadow-md">
                  <Trophy className="w-8 h-8 text-[#2D4F3B]" />
                </div>
                <h3 className="text-xl font-bold text-[#263238] font-['Poppins']">
                  Splendid Job, Aarav! 🌟
                </h3>
                <p className="text-sm text-gray-600">
                  You matched all the memory cards in {moves} moves. Your brain is staying active and sharp!
                </p>
                <button
                  onClick={resetMemoryGame}
                  className="mt-3 px-6 py-3 rounded-2xl bg-[#3B664B] text-white font-bold text-sm hover:bg-[#2D4F3B] shadow-xs"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {cards.map((card, idx) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    disabled={card.isMatched || card.isFlipped}
                    className={`h-24 rounded-2xl font-bold flex flex-col items-center justify-center border-2 transition-all duration-300 text-3xl shadow-xs cursor-pointer ${
                      card.isFlipped || card.isMatched
                        ? 'bg-[#EEF6FB] border-[#A8C9B0] scale-100'
                        : 'bg-[#A8C9B0]/25 border-transparent hover:bg-[#A8C9B0]/40'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <span className="animate-in zoom-in-75">{card.icon}</span>
                    ) : (
                      <span className="text-sm font-semibold text-[#4B7358]">🌱</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-center text-gray-400 mt-4">
              Tap any two cards to find matching natural treasures
            </p>
          </div>
        )}

        {/* Game 2: Gentle Trivia */}
        {activeGame === 'quiz' && (
          <div className="flex-1 py-4 space-y-4">
            <div className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-[#4B7358] uppercase">Question 1</span>
              <h3 className="text-base font-bold text-[#263238] mt-1 font-['Poppins']">
                Which flower is the sacred national flower of India and blooms gracefully above calm water?
              </h3>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 0, text: 'Lotus (ಕಮಲ / कमल)', correct: true },
                { id: 1, text: 'Rose (ಗುಲಾಬಿ / गुलाब)', correct: false },
                { id: 2, text: 'Sunflower (ಸೂರ್ಯಕಾಂತಿ / सूरजमुखी)', correct: false }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setQuizAnswered(opt.id);
                    if (opt.correct) playChime();
                  }}
                  className={`w-full p-4 rounded-2xl text-left font-medium text-sm border transition-all cursor-pointer ${
                    quizAnswered === opt.id
                      ? opt.correct
                        ? 'bg-green-50 border-green-500 text-green-900 shadow-xs'
                        : 'bg-red-50 border-red-300 text-red-800'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.text}</span>
                    {quizAnswered === opt.id && opt.correct && (
                      <Sparkles className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {quizAnswered === 0 && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex items-center space-x-2 text-xs text-green-800">
                <Smile className="w-4 h-4 shrink-0 text-green-600" />
                <span>Correct! Lotus represents purity and calm serenity. Wonderful memory!</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
