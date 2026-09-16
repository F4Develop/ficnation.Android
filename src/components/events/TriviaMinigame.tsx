"use client";

import React, { useState } from "react";
import { Brain, Sparkles, CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addItemToUserInventory } from "@/lib/inventoryStorage";

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_BANK: TriviaQuestion[] = [
  {
    id: 1,
    question: "¿Qué significa la abreviatura 'T/N' o 'Y/N' en las historias interactivas?",
    options: ["Tu Nombre (Your Name)", "Trama Nueva", "Texto Narrativo", "Tercer Nivel"],
    correctIndex: 0,
    explanation: "'T/N' o 'Y/N' representa el nombre del lector protagonista en los fanfics Reader-Insert.",
  },
  {
    id: 2,
    question: "¿Qué término describe el tropo donde dos rivales jurados terminan enamorándose?",
    options: ["Friends to Lovers", "Enemies to Lovers", "Fake Dating", "Hurt/Comfort"],
    correctIndex: 1,
    explanation: "'Enemies to Lovers' es uno de los tropos más leídos y populares de la ficción contemporánea.",
  },
  {
    id: 3,
    question: "¿Qué género se caracteriza por transportar al protagonista a un universo de fantasía paralelo?",
    options: ["Cyberpunk", "Isekai / Portal Fantasy", "Space Opera", "Realismo Mágico"],
    correctIndex: 1,
    explanation: "El género 'Isekai' trata sobre la reencarnación o transporte a otro mundo alternativo.",
  },
  {
    id: 4,
    question: "¿Qué arquetipo define a un personaje que finge ser frío y agresivo pero oculta un corazón dulce?",
    options: ["Yandere", "Dandere", "Tsundere", "Kuudere"],
    correctIndex: 2,
    explanation: "Una personalidad 'Tsundere' alterna entre la aspereza inicial y la ternura cuando baja la guardia.",
  },
];

export function TriviaMinigame() {
  const { user, addXp } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const currentQ = TRIVIA_BANK[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < TRIVIA_BANK.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (user && !hasClaimed) {
        addXp(200, "Completar Trivia del Evento");
        addItemToUserInventory(user.id, "event_spin_ticket", 1);
        addItemToUserInventory(user.id, "badge_trivia_master", 1);
        setHasClaimed(true);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 max-w-xl mx-auto">
      {/* Encabezado */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
          <Brain className="w-3.5 h-3.5" />
          <span>Minijuego Mensual #3</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          🧠 TriviFic: Duelo de Conocimiento
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Demuestra tu sabiduría sobre literatura, anime y fanfiction para ganar <strong>Tickets Astrales</strong> y la insignia de <strong>Sabio de Fandoms</strong>.
        </p>
      </div>

      {!isFinished ? (
        <div className="w-full p-6 rounded-3xl border shadow-xl fic-card space-y-5" style={{ borderColor: "var(--border-primary)" }}>
          {/* Progreso */}
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            <span>Pregunta {currentIndex + 1} de {TRIVIA_BANK.length}</span>
            <span className="text-purple-400 font-bold">Puntos: {score}</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / TRIVIA_BANK.length) * 100}%` }}
            />
          </div>

          {/* Pregunta */}
          <h4 className="text-base sm:text-lg font-black leading-snug" style={{ color: "var(--text-primary)" }}>
            {currentQ.question}
          </h4>

          {/* Opciones */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === currentQ.correctIndex;

              let btnStyle = "fic-card-secondary hover:scale-101";
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(i)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explicación y Botón Siguiente */}
          {isAnswered && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <p className="text-xs p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                💡 <strong>Explicación:</strong> {currentQ.explanation}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 rounded-2xl text-xs font-black text-white fic-btn-primary flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-all cursor-pointer"
              >
                <span>{currentIndex + 1 === TRIVIA_BANK.length ? "Ver Resultados Finales" : "Siguiente Pregunta"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Pantalla de Fin de Trivia */
        <div className="w-full p-8 rounded-3xl border shadow-2xl fic-card text-center space-y-5 animate-fade-in-scale" style={{ borderColor: "var(--border-primary)" }}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-xl">
            <Trophy className="w-10 h-10 text-white animate-bounce" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              ¡Trivia Completada!
            </span>
            <h4 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
              Acertaste {score} de {TRIVIA_BANK.length} preguntas
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {score === TRIVIA_BANK.length
                ? "¡Puntuación perfecta! Has ganado +200 XP, 1 Ticket Astral y la insignia 'Sabio de Fandoms'."
                : "¡Buen intento! Has ganado experiencia por participar y recompensas de evento."}
            </p>
          </div>

          <div className="p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-xs font-bold">
            ✨ Recompensas añadidas a tu inventario y perfil
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl text-xs font-bold border fic-card-secondary hover:scale-105 transition-all cursor-pointer"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar de Nuevo</span>
          </button>
        </div>
      )}
    </div>
  );
}
