import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Smile, Volume2, Heart, Check, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChime, speakText } from '../utils/audio';
import { aiClient } from '../services/aiClient';
import { Language } from '../types';

interface BrainGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  patientName?: string;
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
  { icon: '☀️', name: 'Sun' }
];

type GameTab = 'memory' | 'complete_memory' | 'daily_conversation' | 'association';

export const BrainGamesModal: React.FC<BrainGamesModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
  patientName = 'Aarav'
}) => {
  const [activeGame, setActiveGame] = useState<GameTab>('memory');
  const firstName = patientName.split(' ')[0];

  // 1. Memory Game State
  const generateDeck = (): CardItem[] => {
    const doubled = [...INITIAL_CARDS, ...INITIAL_CARDS];
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

  // 2. Complete the Memory Game State
  const [memoryQIndex, setMemoryQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [aiHint, setAiHint] = useState<string>('');
  const [loadingHint, setLoadingHint] = useState(false);

  const memoryQuestions = [
    {
      question: language === 'kn'
        ? 'ಭಾರತದ ಪವಿತ್ರ ರಾಷ್ಟ್ರೀಯ ಪುಷ್ಪವಾದ ಕಮಲ (Lotus) ನೀರಿನ ಮೇಲೆ ಹೇಗೆ ಅರಳುತ್ತದೆ?'
        : language === 'hi'
        ? 'भारत का पवित्र राष्ट्रीय फूल कमल (Lotus) पानी के ऊपर कैसे खिलता है?'
        : 'Which flower is the sacred national flower that blooms gracefully above calm water?',
      options: [
        { id: 0, text: language === 'kn' ? 'ಕಮಲ (Lotus)' : language === 'hi' ? 'कमल (Lotus)' : 'Lotus 🪷', correct: true },
        { id: 1, text: language === 'kn' ? 'ಗುಲಾಬಿ (Rose)' : language === 'hi' ? 'गुलाब (Rose)' : 'Rose 🌹', correct: false },
        { id: 2, text: language === 'kn' ? 'ಸೂರ್ಯಕಾಂತಿ (Sunflower)' : language === 'hi' ? 'सूरजमुखी (Sunflower)' : 'Sunflower 🌻', correct: false }
      ],
      comfortStory: language === 'kn'
        ? 'ಕಮಲ ಶಾಂತಿ ಮತ್ತು ಶುದ್ಧತೆಯ ಸಂಕೇತವಾಗಿದೆ. ಸುಂದರ ನೆನಪು!'
        : language === 'hi'
        ? 'कमल शांति और पवित्रता का प्रतीक है। बहुत प्यारी याद!'
        : 'The lotus stands for serenity and pure calm. A wonderful memory!'
    },
    {
      question: language === 'kn'
        ? 'ದೀಪಾವಳಿ ಹಬ್ಬದಲ್ಲಿ ಮನೆಯ ಅಂಗಳದಲ್ಲಿ ಪ್ರೀತಿಯಿಂದ ಬೆಳಗುವ ಹಣತೆಗಳೇನು?'
        : language === 'hi'
        ? 'दिवाली के पावन त्योहार पर घर के आंगन में प्यार से क्या जलाया जाता है?'
        : 'What warm lights are gently lit on verandas during the Diwali festival of lights?',
      options: [
        { id: 0, text: language === 'kn' ? 'ಮಣ್ಣಿನ ಹಣತೆಗಳು (Clay Diyas)' : language === 'hi' ? 'मिट्टी के दीये (Diyas)' : 'Clay Diyas 🪔', correct: true },
        { id: 1, text: language === 'kn' ? 'ಬಣ್ಣದ ಬಲೂನುಗಳು' : language === 'hi' ? 'रंगीन गुब्बारे' : 'Colored Balloons 🎈', correct: false },
        { id: 2, text: language === 'kn' ? 'ಹೊಸ ಗಡಿಯಾರಗಳು' : language === 'hi' ? 'नई घड़ियां' : 'New Clocks ⏰', correct: false }
      ],
      comfortStory: language === 'kn'
        ? 'ಮಣ್ಣಿನ ಹಣತೆಗಳು ಪ್ರೀತಿ ಮತ್ತು ಬೆಳಕನ್ನು ತರುತ್ತವೆ. ಸುಂದರ ಕುಟುಂಬ ನೆನಪು!'
        : language === 'hi'
        ? 'दीयों की रोशनी से मन शांत और खुशहाल होता है।'
        : 'Clay diyas bring warmth and joyful light to the whole home.'
    }
  ];

  // 3. Daily Conversation State
  const [convoAnswer, setConvoAnswer] = useState<string>('');
  const [convoFeedback, setConvoFeedback] = useState<string>('');
  const [convoSubmitted, setConvoSubmitted] = useState<boolean>(false);

  const convoTopic = {
    question: language === 'kn'
      ? 'ಇಂದು ಬೆಳಿಗ್ಗೆ ನೀವು ಕುಡಿದ ಬಿಸಿ ಕಾಫಿ ಅಥವಾ ಚಹಾದ ಸುವಾಸನೆ ಹೇಗಿತ್ತು?'
      : language === 'hi'
      ? 'आज सुबह की गरमा-गरम चाय या कॉफी की खुशबू कैसी लगी?'
      : 'How was the warm aroma of your morning tea or coffee today?',
    promptDetails: 'Morning tea aroma and peaceful start'
  };

  // 4. Word & Picture Association State
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const associationPairs = [
    { word: language === 'kn' ? 'ಮುಂಜಾನೆ' : language === 'hi' ? 'सुबह' : 'Morning', icon: '🌅', id: 'morning' },
    { word: language === 'kn' ? 'ಉದ್ಯಾನ' : language === 'hi' ? 'बगीचा' : 'Garden', icon: '🌸', id: 'garden' },
    { word: language === 'kn' ? 'ಸಂಗೀತ' : language === 'hi' ? 'संगीत' : 'Music', icon: '🎶', id: 'music' },
    { word: language === 'kn' ? 'ಮಧ್ಯಾಹ್ನ' : language === 'hi' ? 'दोपहर' : 'Afternoon', icon: '☀️', id: 'afternoon' }
  ];

  if (!isOpen) return null;

  // Memory card click
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

  // Complete the Memory answer click
  const handleSelectAnswer = async (opt: { id: number; text: string; correct: boolean }) => {
    setSelectedAnswer(opt.id);
    if (opt.correct) {
      playChime();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setAiHint(memoryQuestions[memoryQIndex].comfortStory);
    } else {
      setLoadingHint(true);
      try {
        const hint = await aiClient.getCognitiveHint(
          'quiz',
          memoryQuestions[memoryQIndex].question,
          opt.text,
          false,
          language
        );
        setAiHint(hint);
      } catch {
        setAiHint('A wonderful thought! Take another gentle look at the choices.');
      } finally {
        setLoadingHint(false);
      }
    }
  };

  // Daily Conversation Submit
  const handleConvoSubmit = async (text: string) => {
    if (!text.trim()) return;
    setConvoSubmitted(true);
    playChime();
    try {
      const hint = await aiClient.getCognitiveHint(
        'checkin',
        convoTopic.question,
        text,
        true,
        language
      );
      setConvoFeedback(hint);
    } catch {
      setConvoFeedback('Thank you for sharing this lovely feeling with us!');
    }
  };

  // Association click
  const handleAssociationSelect = (id: string) => {
    if (selectedWord === null) {
      setSelectedWord(id);
    } else if (selectedWord === id) {
      // Matched pair
      playChime();
      setMatchedPairs((prev) => [...prev, id]);
      setSelectedWord(null);
      if (matchedPairs.length + 1 === associationPairs.length) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      // Gentle mismatch without shame
      setSelectedWord(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-[36px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-5 sm:p-6 max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-gray-100 transition-colors text-gray-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#263238] font-['Poppins']">
                  Brain Activities
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#A8C9B0]/25 text-[#2D4F3B] text-[10px] font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#3B664B]" />
                  <span>AI Guided</span>
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Gentle, enjoyable memory stimulation for {firstName}
              </p>
            </div>
          </div>

          <button
            onClick={resetMemoryGame}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
            title="Restart current activity"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Games Navigation Bar */}
        <div className="grid grid-cols-4 p-1 bg-[#F8F7F0] rounded-2xl border border-gray-200 my-3 text-[11px] font-bold">
          {[
            { id: 'memory', label: 'Match' },
            { id: 'complete_memory', label: 'Memory' },
            { id: 'daily_conversation', label: 'Chat' },
            { id: 'association', label: 'Pairs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveGame(tab.id as GameTab);
                setAiHint('');
              }}
              className={`py-2 text-center rounded-xl transition-all cursor-pointer truncate px-1 ${
                activeGame === tab.id ? 'bg-[#3B664B] text-white shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --------------------------------------------------------- */}
        {/* GAME 1: MEMORY MATCH CARDS */}
        {/* --------------------------------------------------------- */}
        {activeGame === 'memory' && (
          <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-3">
              <span>Moves: <strong className="text-[#263238]">{moves}</strong></span>
              <span>Matched: <strong className="text-[#2D4F3B]">{matchesCount} / {INITIAL_CARDS.length}</strong></span>
            </div>

            {isWon ? (
              <div className="py-8 text-center space-y-3 bg-[#EEF6FB] rounded-3xl p-5 border border-[#A0CDE8]">
                <div className="w-14 h-14 rounded-full bg-[#A8C9B0] text-white flex items-center justify-center mx-auto shadow-md">
                  <Trophy className="w-7 h-7 text-[#2D4F3B]" />
                </div>
                <h3 className="text-lg font-bold text-[#263238] font-['Poppins']">
                  Splendid Job, {firstName}! 🌟
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  You matched all the calming treasures in {moves} moves. Your brain is staying active and sharp!
                </p>
                <button
                  onClick={resetMemoryGame}
                  className="mt-2 px-5 py-2.5 rounded-2xl bg-[#3B664B] text-white font-bold text-xs hover:bg-[#2D4F3B] shadow-xs cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {cards.map((card, idx) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    disabled={card.isMatched || card.isFlipped}
                    className={`h-22 sm:h-24 rounded-2xl font-bold flex flex-col items-center justify-center border-2 transition-all duration-300 text-3xl shadow-xs cursor-pointer ${
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

            <p className="text-[11px] text-center text-gray-400 mt-4">
              Tap any two cards to find matching natural treasures
            </p>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* GAME 2: COMPLETE THE MEMORY (Reminiscence Trivia) */}
        {/* --------------------------------------------------------- */}
        {activeGame === 'complete_memory' && (
          <div className="flex-1 py-2 space-y-3.5 overflow-y-auto">
            <div className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#4B7358] uppercase">
                  Memory Activity {memoryQIndex + 1} of {memoryQuestions.length}
                </span>
                <button
                  onClick={() => speakText(memoryQuestions[memoryQIndex].question, language)}
                  className="p-1 rounded-lg text-[#3B664B] hover:bg-white cursor-pointer"
                  title="Listen to question"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#263238] mt-1 font-['Poppins'] leading-relaxed">
                {memoryQuestions[memoryQIndex].question}
              </h3>
            </div>

            <div className="space-y-2">
              {memoryQuestions[memoryQIndex].options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`w-full p-3.5 rounded-2xl text-left font-semibold text-xs sm:text-sm border transition-all cursor-pointer ${
                    selectedAnswer === opt.id
                      ? opt.correct
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.text}</span>
                    {selectedAnswer === opt.id && opt.correct && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Non-shaming Adaptive Hint & Comfort Story */}
            {aiHint && (
              <div className="p-3.5 bg-[#EEF6FB] rounded-2xl border border-[#A0CDE8] flex items-start space-x-2.5 text-xs text-[#1E4D6B]">
                <Sparkles className="w-4 h-4 shrink-0 text-[#3B664B] mt-0.5" />
                <div className="flex-1">
                  <p className="leading-relaxed font-medium">{aiHint}</p>
                  <button
                    onClick={() => speakText(aiHint, language)}
                    className="mt-2 text-[10px] font-bold text-[#3B664B] flex items-center space-x-1 cursor-pointer hover:underline"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen aloud</span>
                  </button>
                </div>
              </div>
            )}

            {memoryQIndex < memoryQuestions.length - 1 && selectedAnswer !== null && (
              <button
                onClick={() => {
                  setMemoryQIndex(1);
                  setSelectedAnswer(null);
                  setAiHint('');
                }}
                className="w-full py-2.5 rounded-2xl bg-[#3B664B] text-white text-xs font-bold hover:bg-[#2D4F3B] cursor-pointer"
              >
                Next Memory Question
              </button>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* GAME 3: DAILY CONVERSATION CHECK-IN */}
        {/* --------------------------------------------------------- */}
        {activeGame === 'daily_conversation' && (
          <div className="flex-1 py-2 space-y-3.5 overflow-y-auto">
            <div className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200">
              <span className="text-[10px] font-bold text-[#4B7358] uppercase">
                Gentle Reflection Prompt
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#263238] mt-1 font-['Poppins'] leading-relaxed">
                {convoTopic.question}
              </h3>
            </div>

            {!convoSubmitted ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: language === 'kn' ? 'ತುಂಬಾ ಹಿತಕರವಾಗಿತ್ತು ☕' : language === 'hi' ? 'बहुत सुकून भरा ☕' : 'Very soothing & warm ☕' },
                    { label: language === 'kn' ? 'ತಾಜಾತನ ನೀಡಿತು 🌿' : language === 'hi' ? 'ताज़गी भरा 🌿' : 'Fresh & delightful 🌿' },
                    { label: language === 'kn' ? 'ಶಾಂತವಾಗಿತ್ತು ☀️' : language === 'hi' ? 'शांत और अच्छा ☀️' : 'Peaceful morning ☀️' }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setConvoAnswer(chip.label);
                        handleConvoSubmit(chip.label);
                      }}
                      className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-[#A8C9B0] text-xs font-semibold text-gray-700 text-center transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex space-x-2 pt-2">
                  <input
                    type="text"
                    value={convoAnswer}
                    onChange={(e) => setConvoAnswer(e.target.value)}
                    placeholder="Or type your feelings here..."
                    className="flex-1 p-2.5 text-xs bg-[#F8F7F0] border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0]"
                  />
                  <button
                    onClick={() => handleConvoSubmit(convoAnswer)}
                    disabled={!convoAnswer.trim()}
                    className="px-4 py-2 bg-[#3B664B] disabled:opacity-40 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs text-emerald-900">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-emerald-600 fill-current" />
                  <span className="font-bold">Heartwarming Reflection</span>
                </div>
                <p className="leading-relaxed">{convoFeedback || 'Thank you for sharing your thoughts, Aarav!'}</p>
                <button
                  onClick={() => setConvoSubmitted(false)}
                  className="mt-1 text-[11px] font-bold text-[#3B664B] underline cursor-pointer"
                >
                  Reflect on another question
                </button>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* GAME 4: WORD & PICTURE ASSOCIATION */}
        {/* --------------------------------------------------------- */}
        {activeGame === 'association' && (
          <div className="flex-1 py-2 space-y-3.5 overflow-y-auto">
            <div className="p-3 bg-[#EEF6FB] rounded-2xl border border-[#A0CDE8] text-xs text-[#1E4D6B]">
              <span className="font-bold">Word &amp; Picture Association:</span> Tap a word, then tap its matching peaceful picture!
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {associationPairs.map((pair) => {
                const isMatched = matchedPairs.includes(pair.id);
                const isSelected = selectedWord === pair.id;
                return (
                  <button
                    key={pair.id}
                    onClick={() => handleAssociationSelect(pair.id)}
                    disabled={isMatched}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isMatched
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 opacity-80'
                        : isSelected
                        ? 'bg-[#E7DFFA] border-[#D5C6F5] ring-2 ring-[#D5C6F5]'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm text-[#263238]">{pair.word}</span>
                    <span className="text-2xl">{pair.icon}</span>
                  </button>
                );
              })}
            </div>

            {matchedPairs.length === associationPairs.length && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1 text-emerald-900">
                <span className="font-bold text-sm">All pairs gracefully connected! 🌿</span>
                <p className="text-xs">Your association skills are sharp and clear.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
